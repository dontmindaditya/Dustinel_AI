import { RiskLevel, ShiftType } from "./worker.model";

export interface VisionFaceAnalysis {
  hasMask: boolean;
  hasHelmet: boolean;
  // Raw, weak fatigue signal from visual inference only.
  fatigueScore: number; // 0-1
  estimatedAge: number;
  confidence: number;
  modelSource?: "azure_vision" | "research_model";
}

export interface VisionEnvAnalysis {
  dustLevel: "NONE" | "LOW" | "HIGH" | "EXTREME";
  lightingLevel: "LOW" | "OK" | "GOOD";
  detectedHazards: string[];
  safetyEquipmentVisible: boolean;
  imageClarity: number; // 0-1, derived from Azure Vision caption confidence
  modelSource?: "azure_vision" | "research_model";
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
  impact?: number;
  modelSource?:
    | "rule_engine"
    | "stacking_ensemble"
    | "azure_ml"
    | "azure_vision"
    | "research_model";
}

export interface MLAnalysis {
  healthScore: number; // 0-100
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  modelVersion: string;
  confidence?: number;
  scoringMethod?: "stacking_ensemble" | "azure_ml" | "rule_engine";
}

export interface HealthRecord {
  id: string;
  workerId: string;
  organizationId: string;
  timestamp: string;
  shiftType: ShiftType;
  location: {
    lat: number;
    lng: number;
    site?: string;
  };
  images: {
    faceUrl: string;
    envUrl: string;
  };
  visionAnalysis: VisionAnalysis;
  mlAnalysis: MLAnalysis;
  recommendations: string[];
  alertSent: boolean;
  alertId: string | null;
  ttl?: number; // Cosmos DB TTL: 2 years = 63072000 seconds
}

export interface CreateHealthRecordInput
  extends Omit<HealthRecord, "id" | "timestamp" | "alertSent" | "alertId"> {
  timestamp?: string;
}
