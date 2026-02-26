import axios from "axios";
import { visionConfig } from "../config/azure.config";
import { logger } from "../utils/logger";
import type { VisionFaceAnalysis, VisionEnvAnalysis } from "../models/healthRecord.model";

// Azure AI Vision - Computer Vision REST API v3.2
const VISION_API_BASE = `${visionConfig.endpoint}/vision/v3.2`;

interface AzureVisionResponse {
  categories?: { name: string; score: number }[];
  objects?: { object: string; confidence: number; rectangle?: any }[];
  tags?: { name: string; confidence: number }[];
  faces?: { age: number; faceRectangle: any }[];
  description?: { tags: string[]; captions: { text: string; confidence: number }[] };
  adult?: { isAdultContent: boolean; isRacyContent: boolean };
}

const headers = {
  "Ocp-Apim-Subscription-Key": visionConfig.key,
  "Content-Type": "application/json",
};

/**
 * Analyzes a face image for PPE compliance and fatigue indicators.
 */
export async function analyzeFaceImage(imageUrl: string): Promise<VisionFaceAnalysis> {
  try {
    const response = await axios.post<AzureVisionResponse>(
      `${VISION_API_BASE}/analyze`,
      { url: imageUrl },
      {
        headers,
        params: {
          visualFeatures: "Objects,Tags,Faces,Description",
          language: "en",
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    const objects = data.objects ?? [];
    const tags = data.tags ?? [];
    const faces = data.faces ?? [];

    // Detect helmet — look for object/tag matches
    const hasHelmet = [
      ...objects.map((o) => o.object.toLowerCase()),
      ...tags.map((t) => t.name.toLowerCase()),
    ].some((label) =>
      ["hard hat", "helmet", "safety helmet", "construction helmet", "hardhat"].some((k) =>
        label.includes(k)
      )
    );

    // Detect mask
    const hasMask = [
      ...objects.map((o) => o.object.toLowerCase()),
      ...tags.map((t) => t.name.toLowerCase()),
    ].some((label) =>
      ["mask", "face mask", "respirator", "n95", "medical mask"].some((k) =>
        label.includes(k)
      )
    );

    // Estimate age from faces
    const estimatedAge = faces.length > 0 ? faces[0].age : 30;

    // Fatigue score heuristic — based on description/tags (simplified)
    // In production: use Custom Vision or Face API for real fatigue detection
    const fatigueKeywords = ["tired", "sleepy", "fatigue", "eyes closed", "drowsy"];
    const descriptionText = [
      ...(data.description?.captions?.map((c) => c.text.toLowerCase()) ?? []),
      ...(data.description?.tags?.map((t) => t.toLowerCase()) ?? []),
    ];
    const fatigueHits = fatigueKeywords.filter((k) =>
      descriptionText.some((d) => d.includes(k))
    ).length;
    const fatigueScore = Math.min(1, fatigueHits * 0.25);

    // Confidence from top face detection
    const confidence =
      objects.length > 0 ? Math.max(...objects.map((o) => o.confidence)) : 0.75;

    logger.debug("Face analysis complete", { hasHelmet, hasMask, fatigueScore, estimatedAge });

    return {
      hasMask,
      hasHelmet,
      fatigueScore,
      estimatedAge,
      confidence,
    };
  } catch (err: any) {
    logger.error("Azure AI Vision face analysis failed", { error: err.message, imageUrl });
    // Return conservative defaults if Vision API fails
    return {
      hasMask: false,
      hasHelmet: false,
      fatigueScore: 0.5,
      estimatedAge: 30,
      confidence: 0,
    };
  }
}

/**
 * Analyzes an environment image for hazards, dust, and lighting.
 */
export async function analyzeEnvironmentImage(imageUrl: string): Promise<VisionEnvAnalysis> {
  try {
    const response = await axios.post<AzureVisionResponse>(
      `${VISION_API_BASE}/analyze`,
      { url: imageUrl },
      {
        headers,
        params: {
          visualFeatures: "Objects,Tags,Description",
          language: "en",
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    const allLabels = [
      ...(data.tags?.map((t) => t.name.toLowerCase()) ?? []),
      ...(data.objects?.map((o) => o.object.toLowerCase()) ?? []),
      ...(data.description?.captions?.map((c) => c.text.toLowerCase()) ?? []),
    ];

    // Dust level
    let dustLevel: VisionEnvAnalysis["dustLevel"] = "NONE";
    if (allLabels.some((l) => ["heavy dust", "thick dust", "dust storm", "smoke"].some((k) => l.includes(k)))) {
      dustLevel = "EXTREME";
    } else if (allLabels.some((l) => ["dust", "dusty", "haze", "hazy"].some((k) => l.includes(k)))) {
      dustLevel = "HIGH";
    } else if (allLabels.some((l) => ["dirty", "particles", "debris"].some((k) => l.includes(k)))) {
      dustLevel = "LOW";
    }

    // Lighting
    let lightingLevel: VisionEnvAnalysis["lightingLevel"] = "OK";
    if (allLabels.some((l) => ["dark", "dim", "poorly lit", "shadows", "night"].some((k) => l.includes(k)))) {
      lightingLevel = "LOW";
    } else if (allLabels.some((l) => ["bright", "well lit", "sunlight", "clear"].some((k) => l.includes(k)))) {
      lightingLevel = "GOOD";
    }

    // Hazards
    const hazardKeywords: Record<string, string> = {
      fire: "fire",
      flame: "fire",
      smoke: "smoke",
      flood: "flood",
      "wet floor": "wet_floor",
      water: "wet_floor",
      debris: "debris",
      rubble: "debris",
      chemical: "chemical_spill",
      spill: "chemical_spill",
    };

    const detectedHazards: string[] = [];
    for (const [keyword, hazardId] of Object.entries(hazardKeywords)) {
      if (allLabels.some((l) => l.includes(keyword)) && !detectedHazards.includes(hazardId)) {
        detectedHazards.push(hazardId);
      }
    }

    // Safety equipment visible
    const safetyEquipmentVisible = allLabels.some((l) =>
      ["safety sign", "fire extinguisher", "first aid", "warning sign", "cone"].some((k) =>
        l.includes(k)
      )
    );

    logger.debug("Environment analysis complete", { dustLevel, lightingLevel, detectedHazards });

    return {
      dustLevel,
      lightingLevel,
      detectedHazards,
      safetyEquipmentVisible,
    };
  } catch (err: any) {
    logger.error("Azure AI Vision environment analysis failed", { error: err.message });
    return {
      dustLevel: "LOW",
      lightingLevel: "OK",
      detectedHazards: [],
      safetyEquipmentVisible: false,
    };
  }
}