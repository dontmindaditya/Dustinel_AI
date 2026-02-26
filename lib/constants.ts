export const RISK_THRESHOLDS = {
  LOW: 80,
  MEDIUM: 60,
  HIGH: 40,
  CRITICAL: 0,
} as const;

export const CHECKIN_INTERVAL_HOURS = 6;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/v1";

export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const CAMERA_COUNTDOWN_SECONDS = 3;

export const ALERT_DEDUP_MINUTES = 30;

export const PAGINATION_PAGE_SIZE = 20;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  WORKER_CHECKIN: "/worker/checkin",
  WORKER_DASHBOARD: "/worker/dashboard",
  WORKER_HISTORY: "/worker/history",
  WORKER_SETTINGS: "/worker/settings",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_WORKERS: "/admin/workers",
  ADMIN_ALERTS: "/admin/alerts",
} as const;

export const RISK_SCORE_DEDUCTIONS = {
  NO_MASK: 30,
  NO_HELMET: 25,
  DUST_EXTREME: 20,
  DUST_HIGH: 10,
  POOR_LIGHTING: 10,
  HAZARD_EACH: 5,
  HAZARD_MAX: 20,
  FATIGUE_HIGH: 15,
  FATIGUE_MEDIUM: 8,
  NIGHT_SHIFT: 5,
  PREVIOUS_SCORE_LOW: 5,
  CHRONIC_CONDITION: 5,
} as const;
