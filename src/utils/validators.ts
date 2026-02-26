import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  token: z.string().min(1, "Azure AD B2C token is required"),
});

// ─── Check-in ─────────────────────────────────────────────────────────────────
export const checkinSchema = z.object({
  workerId: z.string().min(1),
  faceImageUrl: z.string().url("Invalid face image URL"),
  envImageUrl: z.string().url("Invalid environment image URL"),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  shiftType: z.enum(["morning", "afternoon", "night"]).optional(),
}).passthrough();

export type CheckinInput = z.infer<typeof checkinSchema>;

// ─── SAS URL request ──────────────────────────────────────────────────────────
export const sasUrlQuerySchema = z.object({
  type: z.enum(["face", "environment"]),
  workerId: z.string().min(1),
});

// ─── Worker ───────────────────────────────────────────────────────────────────
export const createWorkerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1).max(100),
  site: z.string().min(1).max(100),
  shift: z.enum(["morning", "afternoon", "night"]),
  organizationId: z.string().min(1),
  role: z.enum(["worker", "supervisor", "admin"]).optional(),
});

export const updateWorkerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().min(1).max(100).optional(),
  site: z.string().min(1).max(100).optional(),
  shift: z.enum(["morning", "afternoon", "night"]).optional(),
  deviceTokens: z.array(z.string()).optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Alert filters ────────────────────────────────────────────────────────────
export const alertFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
  workerId: z.string().optional(),
  site: z.string().optional(),
});

// ─── Org stats query ─────────────────────────────────────────────────────────
export const orgStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

// ─── High risk query ────────────────────────────────────────────────────────
export const highRiskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  minLevel: z.enum(["HIGH", "CRITICAL"]).default("HIGH"),
});

// ─── Risk trend query ───────────────────────────────────────────────────────
export const riskTrendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

// ─── Validate helper ─────────────────────────────────────────────────────────
import { ValidationError } from "./asyncHandler";

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(
      result.error.flatten().fieldErrors
    )) {
      details[field] = errors as string[];
    }
    throw new ValidationError("Validation failed", details);
  }
  return result.data;
}
