import { RiskLevel } from "./worker.model";

export type AlertStatus = "OPEN" | "RESOLVED";
export type AlertType = "HEALTH_RISK" | "PPE_VIOLATION" | "ENVIRONMENT_HAZARD" | "FATIGUE";
export type NotificationChannel = "push" | "sms" | "email" | "in-app";

export interface Alert {
  id: string;
  organizationId: string;
  workerId: string;
  workerName: string;
  checkinId: string;
  timestamp: string;
  severity: RiskLevel;
  type: AlertType;
  message: string;
  riskFactors: string[];
  status: AlertStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  notificationsSent: NotificationChannel[];
  site: string;
}

export interface CreateAlertInput
  extends Omit<Alert, "id" | "timestamp" | "status" | "resolvedBy" | "resolvedAt" | "notificationsSent"> {}