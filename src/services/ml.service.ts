import axios from "axios";
import { mlConfig } from "../config/azure.config";
import { logger } from "../utils/logger";
import type { VisionAnalysis, MLAnalysis } from "../models/healthRecord.model";
import type { Worker } from "../models/worker.model";
import { calculateRuleBasedScore, buildMLAnalysis } from "./risk.service";

interface MLEndpointInput {
  workerId: string;
  age: number;
  fatigueScore: number;
  hasMask: number;
  hasHelmet: number;
  dustLevel: number;        // 0=NONE, 1=LOW, 2=HIGH, 3=EXTREME
  lightingLevel: number;    // 0=LOW, 1=OK, 2=GOOD
  hazardCount: number;
  shiftType: number;        // 0=morning, 1=afternoon, 2=night
  previousScore: number;
  chronicConditions: number;
  baselineScore: number;
}

interface MLEndpointOutput {
  healthScore: number;
  riskFactors: { type: string; severity: string; weight: number }[];
  confidence: number;
  modelVersion: string;
}

const DUST_MAP: Record<string, number> = { NONE: 0, LOW: 1, HIGH: 2, EXTREME: 3 };
const LIGHTING_MAP: Record<string, number> = { LOW: 0, OK: 1, GOOD: 2 };
const SHIFT_MAP: Record<string, number> = { morning: 0, afternoon: 1, night: 2 };

export async function runMLInference(params: {
  vision: VisionAnalysis;
  worker: Worker;
  shiftType: string;
  previousScore?: number;
}): Promise<MLAnalysis> {
  const { vision, worker, shiftType, previousScore = worker.healthProfile.baselineScore } = params;

  const payload: MLEndpointInput = {
    workerId: worker.workerId,
    age: vision.face.estimatedAge,
    fatigueScore: vision.face.fatigueScore,
    hasMask: vision.face.hasMask ? 1 : 0,
    hasHelmet: vision.face.hasHelmet ? 1 : 0,
    dustLevel: DUST_MAP[vision.environment.dustLevel] ?? 0,
    lightingLevel: LIGHTING_MAP[vision.environment.lightingLevel] ?? 1,
    hazardCount: vision.environment.detectedHazards.length,
    shiftType: SHIFT_MAP[shiftType] ?? 0,
    previousScore,
    chronicConditions: worker.healthProfile.conditions.length,
    baselineScore: worker.healthProfile.baselineScore,
  };

  try {
    const response = await axios.post<MLEndpointOutput>(mlConfig.endpoint, payload, {
      headers: {
        Authorization: `Bearer ${mlConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    const output = response.data;
    logger.debug("ML inference succeeded", {
      workerId: worker.workerId,
      score: output.healthScore,
      confidence: output.confidence,
    });

    return {
      healthScore: Math.round(output.healthScore),
      riskLevel: buildMLAnalysis(output.healthScore, output.riskFactors, true).riskLevel,
      riskFactors: output.riskFactors,
      modelVersion: output.modelVersion ?? "ml-v1",
      confidence: output.confidence,
    };
  } catch (err: any) {
    logger.warn("ML inference failed — falling back to rule engine", {
      error: err.message,
      workerId: worker.workerId,
    });

    // Graceful fallback to rule-based engine
    const { score, riskFactors } = calculateRuleBasedScore({
      vision,
      worker,
      shiftType,
      previousScore,
    });

    return buildMLAnalysis(score, riskFactors, false);
  }
}