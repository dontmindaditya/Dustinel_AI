/**
 * Unit tests for vision.service — tests the parsing/mapping logic
 * by mocking the Azure AI Vision HTTP response.
 */
import axios from "axios";
import { analyzeFaceImage, analyzeEnvironmentImage } from "../../src/services/vision.service";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Silence logger during tests
jest.mock("../../src/utils/logger", () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() },
}));

// Silence env validation
jest.mock("../../src/config/env", () => ({
  env: {
    AZURE_VISION_ENDPOINT: "https://mock.cognitiveservices.azure.com",
    AZURE_VISION_KEY: "mock-key",
    NODE_ENV: "test",
  },
}));

describe("analyzeFaceImage", () => {
  it("detects helmet from objects", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [{ object: "hard hat", confidence: 0.95 }],
        tags: [],
        faces: [{ age: 28, faceRectangle: {} }],
        description: { tags: [], captions: [] },
      },
    });

    const result = await analyzeFaceImage("https://blob.example.com/face.jpg");
    expect(result.hasHelmet).toBe(true);
    expect(result.estimatedAge).toBe(28);
  });

  it("detects mask from tags", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [],
        tags: [{ name: "face mask", confidence: 0.88 }],
        faces: [],
        description: { tags: [], captions: [] },
      },
    });

    const result = await analyzeFaceImage("https://blob.example.com/face.jpg");
    expect(result.hasMask).toBe(true);
  });

  it("returns conservative defaults on Vision API failure", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));

    const result = await analyzeFaceImage("https://blob.example.com/face.jpg");
    expect(result.hasHelmet).toBe(false);
    expect(result.hasMask).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.fatigueScore).toBe(0.5); // conservative — assume moderate fatigue
  });

  it("computes fatigue score from description tags", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [],
        tags: [],
        faces: [],
        description: {
          tags: ["tired", "sleepy"],
          captions: [{ text: "a tired person with closed eyes", confidence: 0.9 }],
        },
      },
    });

    const result = await analyzeFaceImage("https://blob.example.com/face.jpg");
    expect(result.fatigueScore).toBeGreaterThan(0);
  });
});

describe("analyzeEnvironmentImage", () => {
  it("detects extreme dust level", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [],
        tags: [
          { name: "heavy dust", confidence: 0.9 },
          { name: "smoke", confidence: 0.7 },
        ],
        description: { tags: ["dusty", "smoky"], captions: [] },
      },
    });

    const result = await analyzeEnvironmentImage("https://blob.example.com/env.jpg");
    expect(result.dustLevel).toBe("EXTREME");
  });

  it("detects fire hazard", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [{ object: "fire", confidence: 0.95 }],
        tags: [],
        description: { tags: ["flame"], captions: [] },
      },
    });

    const result = await analyzeEnvironmentImage("https://blob.example.com/env.jpg");
    expect(result.detectedHazards).toContain("fire");
  });

  it("detects poor lighting", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        objects: [],
        tags: [{ name: "dark", confidence: 0.85 }],
        description: { tags: ["dim"], captions: [] },
      },
    });

    const result = await analyzeEnvironmentImage("https://blob.example.com/env.jpg");
    expect(result.lightingLevel).toBe("LOW");
  });

  it("returns safe defaults on API error", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Timeout"));

    const result = await analyzeEnvironmentImage("https://blob.example.com/env.jpg");
    expect(result.dustLevel).toBe("LOW"); // conservative
    expect(result.detectedHazards).toHaveLength(0);
  });
});