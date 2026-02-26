import { RiskLevel, ShiftType, Location } from "./worker";

export interface VisionFaceAnalysis {
  hasMask: boolean;
  hasHelmet: boolean;
  fatigueScore: number;
  estimatedAge: number;
  confidence: number;
}

export interface VisionEnvAnalysis {
  dustLevel: "NONE" | "LOW" | "HIGH" | "EXTREME";
  lightingLevel: "LOW" | "OK" | "GOOD";
  detectedHazards: string[];
  safetyEquipmentVisible: boolean;
}

export interface VisionAnalysis {
  face: VisionFaceAnalysis;
  environment: VisionEnvAnalysis;
}

export interface RiskFactor {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  confidence?: number;
  weight?: number;
}

export interface MLAnalysis {
  healthScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  modelVersion: string;
}

export interface HealthRecord {
  id: string;
  workerId: string;
  organizationId: string;
  timestamp: string;
  shiftType: ShiftType;
  location: Location;
  images: {
    faceUrl: string;
    envUrl: string;
  };
  visionAnalysis: VisionAnalysis;
  mlAnalysis: MLAnalysis;
  recommendations: string[];
  alertSent: boolean;
  alertId: string | null;
  ttl?: number;
}

export interface HealthStats {
  avgScore7Days: number;
  avgScore30Days: number;
  alertCount7Days: number;
  totalCheckins: number;
  streakDaysLowRisk: number;
  trend: "improving" | "declining" | "stable";
}