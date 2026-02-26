export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ShiftType = "morning" | "afternoon" | "night";
export type WorkerRole = "worker" | "supervisor" | "admin";

export interface Location {
  lat: number;
  lng: number;
  site?: string;
}

export interface HealthProfile {
  baselineScore: number;
  conditions: string[];
  lastCheckin: string | null;
  currentRiskLevel: RiskLevel | null;
  streakDaysLowRisk: number;
}

export interface Worker {
  id: string;
  workerId: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  role: WorkerRole;
  department: string;
  site: string;
  shift: ShiftType;
  azureUserId: string;
  deviceTokens: string[];
  healthProfile: HealthProfile;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSummary {
  workerId: string;
  name: string;
  department: string;
  site: string;
  currentRiskLevel: RiskLevel | null;
  lastCheckin: string | null;
  healthScore: number | null;
}