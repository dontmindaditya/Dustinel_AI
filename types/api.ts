import { RiskLevel, Worker, WorkerSummary } from "./worker";
import { HealthRecord, RiskFactor, HealthStats } from "./health";

// Auth
export interface LoginRequest {
  token: string; // Azure AD B2C token
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

// Check-in
export interface CheckinRequest {
  workerId: string;
  faceImageUrl: string;
  envImageUrl: string;
  location: { lat: number; lng: number };
  shiftType: string;
}

export interface CheckinResponse {
  checkinId: string;
  workerId: string;
  timestamp: string;
  healthScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  recommendations: string[];
  alertSent: boolean;
  nextCheckinDue: string;
}

// SAS URL
export interface SasUrlResponse {
  sasUrl: string;
  expiresAt: string;
  blobUrl: string;
}

// Workers
export interface WorkersListResponse {
  workers: WorkerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkerHistoryResponse {
  records: HealthRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkerStatsResponse {
  stats: HealthStats;
}

// Admin
export interface DashboardSummary {
  totalWorkers: number;
  activeToday: number;
  avgRiskScore: number;
  alertsToday: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskDistribution: { level: RiskLevel; count: number; percentage: number }[];
}

export interface Alert {
  id: string;
  organizationId: string;
  workerId: string;
  workerName: string;
  checkinId: string;
  timestamp: string;
  severity: RiskLevel;
  type: string;
  message: string;
  riskFactors: string[];
  status: "OPEN" | "RESOLVED";
  resolvedBy: string | null;
  resolvedAt: string | null;
  notificationsSent: string[];
  site: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RiskTrendDataPoint {
  date: string;
  avgScore: number;
  criticalCount: number;
  highCount: number;
}

// Generic API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}