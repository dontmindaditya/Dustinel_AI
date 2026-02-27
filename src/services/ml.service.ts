import axios from "axios";
import { mlConfig } from "../config/azure.config";
import { logger } from "../utils/logger";
import type { VisionAnalysis, MLAnalysis, RiskFactor } from "../models/healthRecord.model";
import type { Worker } from "../models/worker.model";
import { buildMLAnalysis, calculateRuleBasedScore, scoreToRiskLevel } from "./risk.service";

interface MLEndpointInput {
  workerId: string;
  age: number;
  fatigueScore: number;
  hasMask: number;
  hasHelmet: number;
  dustLevel: number;
  lightingLevel: number;
  hazardCount: number;
  shiftType: number;
  previousScore: number;
  chronicConditions: number;
  baselineScore: number;
}

interface MLEndpointOutput {
  healthScore: number;
  riskFactors: { type: string; severity: "LOW" | "MEDIUM" | "HIGH"; weight: number }[];
  confidence: number;
  modelVersion: string;
}

const DUST_MAP: Record<string, number> = { NONE: 0, LOW: 1, HIGH: 2, EXTREME: 3 };
const LIGHTING_MAP: Record<string, number> = { LOW: 0, OK: 1, GOOD: 2 };
const SHIFT_MAP: Record<string, number> = { morning: 0, afternoon: 1, night: 2 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Structured fatigue computation inspired by occupational risk signals.
 * Raw vision fatigue is treated as a weak signal; context signals dominate.
 * Used alongside the stacking strategy from MDPI Applied Sciences
 * (ISSN 2076-3417, paper 15(6):3129).
 */
export function computeFatigueScore(params: {
  shiftType: string;
  previousScore: number;
  baselineScore: number;
  conditions: string[];
  lastCheckin: string | null;
  visionFatigueSignal: number;
}): number {
  const {
    shiftType,
    previousScore,
    baselineScore,
    conditions,
    lastCheckin,
    visionFatigueSignal,
  } = params;

  const shiftSignal = shiftType === "night" ? 1 : shiftType === "afternoon" ? 0.5 : 0.2;
  const trendSignal = clamp((baselineScore - previousScore) / 30, 0, 1);
  const conditionSignal = clamp(conditions.length * 0.25, 0, 1);

  let recencySignal = 0.35;
  if (lastCheckin) {
    const elapsedHours = Math.max(0, (Date.now() - new Date(lastCheckin).getTime()) / 3600000);
    recencySignal = clamp(elapsedHours / 48, 0, 1);
  }

  const weakVisionSignal = clamp(visionFatigueSignal, 0, 1);

  // Weighted formula:
  // shift 30%, trend 25%, conditions 20%, recency 15%, vision signal 10%.
  const fatigue =
    shiftSignal * 0.3 +
    trendSignal * 0.25 +
    conditionSignal * 0.2 +
    recencySignal * 0.15 +
    weakVisionSignal * 0.1;

  return Math.round(clamp(fatigue, 0, 1) * 1000) / 1000;
}

/**
 * MDPI Applied Sciences stacking-style ensemble:
 * combine weak classifiers then run a weighted meta-learner
 * (paper identifier: 2076-3417/15/6/3129).
 */
export function computeStackedScore(params: {
  vision: VisionAnalysis;
  worker: Worker;
  shiftType: string;
  previousScore: number;
  fatigueLevel: number;
}): { score: number; riskFactors: RiskFactor[] } {
  const { vision, worker, shiftType, previousScore, fatigueLevel } = params;

  const enrichedVision: VisionAnalysis = {
    ...vision,
    face: { ...vision.face, fatigueScore: fatigueLevel },
  };
  const { score: ruleScore } = calculateRuleBasedScore({
    vision: enrichedVision,
    worker,
    shiftType,
    previousScore,
  });

  const shiftScore = shiftType === "morning" ? 100 : shiftType === "afternoon" ? 85 : 65;

  let envScore = 100;
  if (vision.environment.dustLevel === "LOW") envScore -= 8;
  if (vision.environment.dustLevel === "HIGH") envScore -= 20;
  if (vision.environment.dustLevel === "EXTREME") envScore -= 35;
  if (vision.environment.lightingLevel === "LOW") envScore -= 10;
  if (vision.environment.lightingLevel === "GOOD") envScore += 2;
  envScore -= Math.min(vision.environment.detectedHazards.length * 8, 25);
  envScore = clamp(envScore, 0, 100);

  let ppeScore = 100;
  if (!vision.face.hasHelmet) ppeScore -= 30;
  if (!vision.face.hasMask) ppeScore -= 30;
  ppeScore = clamp(ppeScore, 0, 100);

  const fatigueScore = clamp(100 - fatigueLevel * 60, 0, 100);

  const delta = previousScore - worker.healthProfile.baselineScore;
  const trendScore =
    delta >= 10 ? 100 : delta >= 0 ? 92 : delta >= -10 ? 80 : delta >= -20 ? 68 : 55;

  const finalScore =
    ruleScore * 0.35 +
    ppeScore * 0.25 +
    envScore * 0.2 +
    fatigueScore * 0.12 +
    trendScore * 0.08;

  const riskFactors: RiskFactor[] = [];
  if (ppeScore <= 70) {
    riskFactors.push({
      type: "PPE_NON_COMPLIANCE",
      severity: ppeScore <= 40 ? "HIGH" : "MEDIUM",
      weight: 0.25,
      confidence: vision.face.confidence,
      modelSource: "stacking_ensemble",
    });
  }
  if (envScore <= 75) {
    riskFactors.push({
      type: "ENVIRONMENTAL_EXPOSURE",
      severity: envScore <= 55 ? "HIGH" : "MEDIUM",
      weight: 0.2,
      confidence: 1 - vision.environment.imageClarity,
      modelSource: "stacking_ensemble",
    });
  }
  if (fatigueScore <= 70) {
    riskFactors.push({
      type: "FATIGUE_RISK",
      severity: fatigueScore <= 55 ? "HIGH" : "MEDIUM",
      weight: 0.12,
      confidence: fatigueLevel,
      modelSource: "stacking_ensemble",
    });
  }
  if (trendScore <= 70) {
    riskFactors.push({
      type: "HEALTH_TREND_DECLINE",
      severity: "MEDIUM",
      weight: 0.08,
      modelSource: "stacking_ensemble",
    });
  }

  return {
    score: Math.round(clamp(finalScore, 0, 100)),
    riskFactors,
  };
}

export async function runMLInference(params: {
  vision: VisionAnalysis;
  worker: Worker;
  shiftType: string;
  previousScore?: number;
}): Promise<MLAnalysis> {
  const shiftType = params.shiftType ?? params.worker.shift ?? "morning";
  const previousScore = params.previousScore ?? params.worker.healthProfile.baselineScore;

  try {
    const fatigueLevel = computeFatigueScore({
      shiftType,
      previousScore,
      baselineScore: params.worker.healthProfile.baselineScore,
      conditions: params.worker.healthProfile.conditions,
      lastCheckin: params.worker.healthProfile.lastCheckin,
      visionFatigueSignal: params.vision.face.fatigueScore,
    });

    const stacked = computeStackedScore({
      vision: params.vision,
      worker: params.worker,
      shiftType,
      previousScore,
      fatigueLevel,
    });

    const stackedAnalysis: MLAnalysis = {
      healthScore: stacked.score,
      riskLevel: scoreToRiskLevel(stacked.score),
      riskFactors: stacked.riskFactors
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
        .slice(0, 5),
      modelVersion: "stacking-ensemble-v1.0",
      confidence: 0.84,
      scoringMethod: "stacking_ensemble",
    };

    const payload: MLEndpointInput = {
      workerId: params.worker.workerId,
      age: params.vision.face.estimatedAge,
      fatigueScore: fatigueLevel,
      hasMask: params.vision.face.hasMask ? 1 : 0,
      hasHelmet: params.vision.face.hasHelmet ? 1 : 0,
      dustLevel: DUST_MAP[params.vision.environment.dustLevel] ?? 0,
      lightingLevel: LIGHTING_MAP[params.vision.environment.lightingLevel] ?? 1,
      hazardCount: params.vision.environment.detectedHazards.length,
      shiftType: SHIFT_MAP[shiftType] ?? 0,
      previousScore,
      chronicConditions: params.worker.healthProfile.conditions.length,
      baselineScore: params.worker.healthProfile.baselineScore,
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
      logger.debug("Azure ML override succeeded", {
        workerId: params.worker.workerId,
        score: output.healthScore,
      });

      return {
        healthScore: Math.round(output.healthScore),
        riskLevel: scoreToRiskLevel(output.healthScore),
        riskFactors: (output.riskFactors ?? []).map((f) => ({
          ...f,
          modelSource: "azure_ml",
        })),
        modelVersion: output.modelVersion ?? "azure-ml-v1",
        confidence: output.confidence,
        scoringMethod: "azure_ml",
      };
    } catch (err: any) {
      logger.warn("Azure ML override unavailable; using stacking ensemble", {
        error: err.message,
        workerId: params.worker.workerId,
      });
      return stackedAnalysis;
    }
  } catch (err: any) {
    logger.error("Stacking inference failed; falling back to rule engine", {
      error: err.message,
      workerId: params.worker.workerId,
    });

    const { score, riskFactors } = calculateRuleBasedScore({
      vision: params.vision,
      worker: params.worker,
      shiftType,
      previousScore,
    });
    const fallback = buildMLAnalysis(score, riskFactors, false);
    fallback.scoringMethod = "rule_engine";
    return fallback;
  }
}
