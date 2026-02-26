import {
  calculateRuleBasedScore,
  scoreToRiskLevel,
  buildMLAnalysis,
} from "../../src/services/risk.service";
import type { VisionAnalysis } from "../../src/models/healthRecord.model";
import type { Worker } from "../../src/models/worker.model";

const baseWorker: Worker = {
  id: "w1",
  workerId: "worker_001",
  organizationId: "org_test",
  name: "Test Worker",
  email: "test@safe.com",
  phone: "",
  role: "worker",
  department: "Mining",
  site: "Site A",
  shift: "morning",
  azureUserId: "az_001",
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
};

const perfectVision: VisionAnalysis = {
  face: { hasMask: true, hasHelmet: true, fatigueScore: 0.1, estimatedAge: 30, confidence: 0.95 },
  environment: { dustLevel: "NONE", lightingLevel: "GOOD", detectedHazards: [], safetyEquipmentVisible: true },
};

const dangerousVision: VisionAnalysis = {
  face: { hasMask: false, hasHelmet: false, fatigueScore: 0.9, estimatedAge: 30, confidence: 0.90 },
  environment: { dustLevel: "EXTREME", lightingLevel: "LOW", detectedHazards: ["fire", "chemical_spill"], safetyEquipmentVisible: false },
};

describe("calculateRuleBasedScore", () => {
  it("returns 100 for perfect PPE and clean environment", () => {
    const { score } = calculateRuleBasedScore({
      vision: perfectVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    expect(score).toBe(100);
  });

  it("deducts 30 for missing mask", () => {
    const noMaskVision: VisionAnalysis = {
      ...perfectVision,
      face: { ...perfectVision.face, hasMask: false },
    };
    const { score, riskFactors } = calculateRuleBasedScore({
      vision: noMaskVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    expect(score).toBe(70);
    expect(riskFactors.some((f) => f.type === "NO_MASK")).toBe(true);
  });

  it("deducts 25 for missing helmet", () => {
    const noHelmetVision: VisionAnalysis = {
      ...perfectVision,
      face: { ...perfectVision.face, hasHelmet: false },
    };
    const { score } = calculateRuleBasedScore({
      vision: noHelmetVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    expect(score).toBe(75);
  });

  it("applies night shift penalty", () => {
    const { score: morningScore } = calculateRuleBasedScore({
      vision: perfectVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    const { score: nightScore } = calculateRuleBasedScore({
      vision: perfectVision,
      worker: baseWorker,
      shiftType: "night",
    });
    expect(nightScore).toBe(morningScore - 5);
  });

  it("clamps score to 0 in extreme danger scenario", () => {
    const { score } = calculateRuleBasedScore({
      vision: dangerousVision,
      worker: baseWorker,
      shiftType: "night",
    });
    expect(score).toBe(0);
  });

  it("applies chronic condition penalty", () => {
    const workerWithConditions: Worker = {
      ...baseWorker,
      healthProfile: { ...baseWorker.healthProfile, conditions: ["asthma"] },
    };
    const { score } = calculateRuleBasedScore({
      vision: perfectVision,
      worker: workerWithConditions,
      shiftType: "morning",
    });
    expect(score).toBe(95); // -5 for chronic condition
  });

  it("applies high fatigue penalty (>0.7)", () => {
    const fatiguedVision: VisionAnalysis = {
      ...perfectVision,
      face: { ...perfectVision.face, fatigueScore: 0.8 },
    };
    const { score, riskFactors } = calculateRuleBasedScore({
      vision: fatiguedVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    expect(score).toBe(85);
    expect(riskFactors.some((f) => f.type === "HIGH_FATIGUE")).toBe(true);
  });

  it("returns riskFactors sorted by weight descending", () => {
    const { riskFactors } = calculateRuleBasedScore({
      vision: dangerousVision,
      worker: baseWorker,
      shiftType: "morning",
    });
    for (let i = 0; i < riskFactors.length - 1; i++) {
      expect((riskFactors[i].weight ?? 0) >= (riskFactors[i + 1].weight ?? 0));
    }
  });
});

describe("scoreToRiskLevel", () => {
  it("maps 100 → LOW", () => expect(scoreToRiskLevel(100)).toBe("LOW"));
  it("maps 80 → LOW", () => expect(scoreToRiskLevel(80)).toBe("LOW"));
  it("maps 79 → MEDIUM", () => expect(scoreToRiskLevel(79)).toBe("MEDIUM"));
  it("maps 60 → MEDIUM", () => expect(scoreToRiskLevel(60)).toBe("MEDIUM"));
  it("maps 59 → HIGH", () => expect(scoreToRiskLevel(59)).toBe("HIGH"));
  it("maps 40 → HIGH", () => expect(scoreToRiskLevel(40)).toBe("HIGH"));
  it("maps 39 → CRITICAL", () => expect(scoreToRiskLevel(39)).toBe("CRITICAL"));
  it("maps 0 → CRITICAL", () => expect(scoreToRiskLevel(0)).toBe("CRITICAL"));
});

describe("buildMLAnalysis", () => {
  it("includes modelVersion for rule engine", () => {
    const analysis = buildMLAnalysis(75, [], false);
    expect(analysis.modelVersion).toBe("rules-v1.0.0");
    expect(analysis.confidence).toBe(1.0);
  });

  it("includes modelVersion for ML", () => {
    const analysis = buildMLAnalysis(75, [], true);
    expect(analysis.modelVersion).toBe("ml-xgboost-v2.1.0");
    expect(analysis.confidence).toBe(0.89);
  });

  it("rounds the health score", () => {
    const analysis = buildMLAnalysis(74.6, []);
    expect(analysis.healthScore).toBe(75);
  });
});