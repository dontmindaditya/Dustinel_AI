import type { VisionAnalysis, MLAnalysis, RiskFactor } from "../models/healthRecord.model";
import type { Worker, RiskLevel } from "../models/worker.model";

const DEDUCTIONS = {
  NO_MASK: 30,
  NO_HELMET: 25,
  DUST_EXTREME: 20,
  DUST_HIGH: 10,
  POOR_LIGHTING: 10,
  HAZARD_EACH: 5,
  HAZARD_MAX: 20,
  FATIGUE_HIGH: 15,
  FATIGUE_MED: 8,
  NIGHT_SHIFT: 5,
  PREVIOUS_SCORE_LOW: 5,
  CHRONIC_CONDITION: 5,
} as const;

export function calculateRuleBasedScore(params: {
  vision: VisionAnalysis;
  worker: Worker;
  shiftType: string;
  previousScore?: number;
  mandatoryPPE?: string[];
}): { score: number; riskFactors: RiskFactor[] } {
  const { vision, worker, shiftType, previousScore, mandatoryPPE = ["helmet", "mask"] } = params;
  let score = 100;
  const riskFactors: RiskFactor[] = [];

  if (mandatoryPPE.includes("mask") && !vision.face.hasMask) {
    score -= DEDUCTIONS.NO_MASK;
    riskFactors.push({
      type: "NO_MASK",
      severity: "HIGH",
      weight: 0.35,
      confidence: vision.face.confidence,
      modelSource: "rule_engine",
    });
  }
  if (mandatoryPPE.includes("helmet") && !vision.face.hasHelmet) {
    score -= DEDUCTIONS.NO_HELMET;
    riskFactors.push({
      type: "NO_HELMET",
      severity: "HIGH",
      weight: 0.3,
      confidence: vision.face.confidence,
      modelSource: "rule_engine",
    });
  }

  if (vision.environment.dustLevel === "EXTREME") {
    score -= DEDUCTIONS.DUST_EXTREME;
    riskFactors.push({
      type: "DUST_LEVEL_EXTREME",
      severity: "HIGH",
      weight: 0.2,
      modelSource: "rule_engine",
    });
  } else if (vision.environment.dustLevel === "HIGH") {
    score -= DEDUCTIONS.DUST_HIGH;
    riskFactors.push({
      type: "DUST_LEVEL_ELEVATED",
      severity: "MEDIUM",
      weight: 0.1,
      modelSource: "rule_engine",
    });
  }

  if (vision.environment.lightingLevel === "LOW") {
    score -= DEDUCTIONS.POOR_LIGHTING;
    riskFactors.push({
      type: "POOR_LIGHTING",
      severity: "MEDIUM",
      weight: 0.1,
      modelSource: "rule_engine",
    });
  }

  const hazardDeduction = Math.min(
    vision.environment.detectedHazards.length * DEDUCTIONS.HAZARD_EACH,
    DEDUCTIONS.HAZARD_MAX
  );
  if (hazardDeduction > 0) {
    score -= hazardDeduction;
    vision.environment.detectedHazards.forEach((hazard) => {
      riskFactors.push({
        type: `HAZARD_${hazard.toUpperCase()}`,
        severity: "MEDIUM",
        weight: 0.05,
        modelSource: "rule_engine",
      });
    });
  }

  if (vision.face.fatigueScore > 0.7) {
    score -= DEDUCTIONS.FATIGUE_HIGH;
    riskFactors.push({
      type: "HIGH_FATIGUE",
      severity: "HIGH",
      weight: 0.15,
      confidence: vision.face.fatigueScore,
      modelSource: "rule_engine",
    });
  } else if (vision.face.fatigueScore > 0.5) {
    score -= DEDUCTIONS.FATIGUE_MED;
    riskFactors.push({
      type: "MODERATE_FATIGUE",
      severity: "MEDIUM",
      weight: 0.08,
      confidence: vision.face.fatigueScore,
      modelSource: "rule_engine",
    });
  }

  if (shiftType === "night") {
    score -= DEDUCTIONS.NIGHT_SHIFT;
    riskFactors.push({
      type: "NIGHT_SHIFT",
      severity: "LOW",
      weight: 0.05,
      modelSource: "rule_engine",
    });
  }

  if (previousScore !== undefined && previousScore < 60) {
    score -= DEDUCTIONS.PREVIOUS_SCORE_LOW;
    riskFactors.push({
      type: "PREVIOUS_SCORE_LOW",
      severity: "LOW",
      weight: 0.05,
      modelSource: "rule_engine",
    });
  }

  if (worker.healthProfile.conditions.length > 0) {
    score -= DEDUCTIONS.CHRONIC_CONDITION;
    riskFactors.push({
      type: "CHRONIC_CONDITION",
      severity: "LOW",
      weight: 0.05,
      modelSource: "rule_engine",
    });
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, riskFactors };
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "HIGH";
  return "CRITICAL";
}

export function buildMLAnalysis(score: number, riskFactors: RiskFactor[], useML = false): MLAnalysis {
  return {
    healthScore: Math.round(score),
    riskLevel: scoreToRiskLevel(score),
    riskFactors: riskFactors.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 5),
    modelVersion: useML ? "ml-xgboost-v2.1.0" : "rules-v1.0.0",
    confidence: useML ? 0.89 : 1.0,
    scoringMethod: useML ? "azure_ml" : "rule_engine",
  };
}
