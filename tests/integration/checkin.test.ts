/**
 * Integration tests for the check-in pipeline.
 * External Azure services (Vision, ML, Cosmos, Blob) are mocked.
 */
import request from "supertest";
import { createApp } from "../../src/app";
import { Application } from "express";

// ─── Global service mocks ─────────────────────────────────────────────────────

jest.mock("../../src/config/env", () => ({
  env: {
    PORT: 5001,
    NODE_ENV: "test",
    AZURE_AD_B2C_TENANT: "test.b2clogin.com",
    AZURE_AD_B2C_TENANT_ID: "test-tenant-id",
    AZURE_AD_B2C_CLIENT_ID: "test-client-id",
    AZURE_AD_B2C_USER_FLOW: "B2C_1_signupsignin",
    AZURE_VISION_ENDPOINT: "https://mock.cognitiveservices.azure.com",
    AZURE_VISION_KEY: "mock-key",
    AZURE_STORAGE_ACCOUNT_NAME: "mockaccount",
    AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=mock;AccountKey=mock==;EndpointSuffix=core.windows.net",
    AZURE_STORAGE_CONTAINER_NAME: "safeguard-test",
    COSMOS_ENDPOINT: "https://mock.documents.azure.com:443/",
    COSMOS_KEY: "mock-cosmos-key",
    COSMOS_DATABASE_NAME: "safeguardai-test",
    AZURE_ML_ENDPOINT: "https://mock-ml.region.inference.ml.azure.com/score",
    AZURE_ML_API_KEY: "mock-ml-key",
    NOTIFICATION_HUB_CONNECTION_STRING: "Endpoint=sb://mock.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=mock",
    NOTIFICATION_HUB_NAME: "mock-hub",
    AZURE_COMMUNICATION_CONNECTION_STRING: "endpoint=https://mock.communication.azure.com;accesskey=mock",
    AZURE_COMMUNICATION_SENDER_EMAIL: "donotreply@mock.com",
    ALLOWED_ORIGINS: "http://localhost:3000",
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 1000,
    CHECKIN_RATE_LIMIT_MAX: 100,
  },
}));

jest.mock("../../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      sub: "test-user-001",
      email: "worker@test.com",
      name: "Test Worker",
      role: "worker",
      organizationId: "org_test",
      workerId: "worker_001",
    };
    next();
  },
  devAuthMiddleware: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/services/cosmos.service", () => ({
  workerRepository: {
    findById: jest.fn().mockResolvedValue({
      id: "worker_001",
      workerId: "worker_001",
      organizationId: "org_test",
      name: "Test Worker",
      email: "worker@test.com",
      phone: "+1234567890",
      role: "worker",
      department: "Mining",
      site: "Site A",
      shift: "morning",
      azureUserId: "test-user-001",
      deviceTokens: [],
      healthProfile: {
        baselineScore: 85,
        conditions: [],
        lastCheckin: null,
        currentRiskLevel: null,
        streakDaysLowRisk: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateHealthProfile: jest.fn().mockResolvedValue(undefined),
  },
  healthRecordRepository: {
    create: jest.fn().mockResolvedValue({
      id: "chk_test123",
      timestamp: new Date().toISOString(),
    }),
    listByWorker: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    getStats: jest.fn().mockResolvedValue(null),
  },
  alertRepository: {
    create: jest.fn().mockResolvedValue({ id: "alert_001", type: "HEALTH_RISK" }),
    getLastAlertTime: jest.fn().mockResolvedValue(null),
    list: jest.fn().mockResolvedValue({ alerts: [], total: 0 }),
  },
}));

jest.mock("../../src/services/vision.service", () => ({
  analyzeFaceImage: jest.fn().mockResolvedValue({
    hasMask: true,
    hasHelmet: true,
    fatigueScore: 0.2,
    estimatedAge: 30,
    confidence: 0.92,
  }),
  analyzeEnvironmentImage: jest.fn().mockResolvedValue({
    dustLevel: "NONE",
    lightingLevel: "GOOD",
    detectedHazards: [],
    safetyEquipmentVisible: true,
  }),
}));

jest.mock("../../src/services/ml.service", () => ({
  runMLInference: jest.fn().mockResolvedValue({
    healthScore: 92,
    riskLevel: "LOW",
    riskFactors: [],
    modelVersion: "rules-v1.0.0",
    confidence: 1.0,
  }),
}));

jest.mock("../../src/services/notification.service", () => ({
  sendAlertNotifications: jest.fn().mockResolvedValue(["in-app"]),
  shouldThrottle: jest.fn().mockReturnValue(false),
}));

jest.mock("../../src/utils/logger", () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() },
  httpLogger: jest.fn(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

let app: Application;

beforeAll(() => {
  app = createApp();
});

describe("GET /ping", () => {
  it("returns 200 with ok status", async () => {
    const res = await request(app).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("POST /api/v1/checkin", () => {
  const validPayload = {
    workerId: "worker_001",
    faceImageUrl: "https://safeguard.blob.core.windows.net/images/face/worker_001.jpg",
    envImageUrl: "https://safeguard.blob.core.windows.net/images/env/worker_001.jpg",
    shiftType: "morning",
    location: { lat: -26.2041, lng: 28.0473 },
  };

  it("returns 201 with health score on valid check-in", async () => {
    const res = await request(app)
      .post("/api/v1/checkin")
      .send(validPayload)
      .set("Authorization", "Bearer mock-token");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.healthScore).toBe(92);
    expect(res.body.riskLevel).toBe("LOW");
    expect(res.body.checkinId).toBeDefined();
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it("returns 400 when workerId is missing", async () => {
    const { workerId: _, ...payload } = validPayload;
    const res = await request(app)
      .post("/api/v1/checkin")
      .send(payload)
      .set("Authorization", "Bearer mock-token");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.details?.workerId).toBeDefined();
  });

  it("returns 400 for invalid image URLs", async () => {
    const res = await request(app)
      .post("/api/v1/checkin")
      .send({ ...validPayload, faceImageUrl: "not-a-url" })
      .set("Authorization", "Bearer mock-token");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid shiftType", async () => {
    const res = await request(app)
      .post("/api/v1/checkin")
      .send({ ...validPayload, shiftType: "weekend" })
      .set("Authorization", "Bearer mock-token");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("triggers alert when risk level is HIGH", async () => {
    const { runMLInference } = require("../../src/services/ml.service");
    runMLInference.mockResolvedValueOnce({
      healthScore: 35,
      riskLevel: "CRITICAL",
      riskFactors: [{ type: "NO_MASK", severity: "HIGH", weight: 0.35 }],
      modelVersion: "rules-v1.0.0",
      confidence: 1.0,
    });

    const res = await request(app)
      .post("/api/v1/checkin")
      .send(validPayload)
      .set("Authorization", "Bearer mock-token");

    expect(res.status).toBe(201);
    expect(res.body.alertTriggered).toBe(true);
    expect(res.body.alertId).toBeDefined();
  });
});

describe("GET /api/v1/checkin/sas-url", () => {
  it("returns 400 when type param is missing", async () => {
    const res = await request(app)
      .get("/api/v1/checkin/sas-url?workerId=worker_001")
      .set("Authorization", "Bearer mock-token");

    // Validation should catch the missing 'type' param
    expect(res.status).toBe(400);
  });
});

describe("Unknown route", () => {
  it("returns 404 for undefined routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});