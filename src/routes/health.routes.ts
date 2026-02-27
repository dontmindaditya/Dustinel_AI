/**
 * Health Record Routes — /api/v1/health
 *
 * Read-only access to health check-in records and aggregated data.
 * Mutation of health records is handled exclusively through the /checkin pipeline.
 *
 * All routes require authentication.
 *
 *   GET /records/:workerId              Paginated check-in history
 *   GET /records/:workerId/latest       Most recent check-in
 *   GET /records/:workerId/trend        Score trend for a date range
 *   GET /records/:workerId/:recordId    Single check-in record detail
 *   GET /org-summary                    Today's snapshot for org heatmap (supervisor+)
 *   GET /org-stats                      Org-wide aggregate stats (supervisor+)
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole, ownDataOrAdmin } from "../middleware/role.middleware";
import { asyncHandler, ForbiddenError, NotFoundError } from "../utils/asyncHandler";
import { validate, paginationSchema } from "../utils/validators";
import * as healthController from "../controllers/health.controller";
import { getModelDebugPredictions } from "../services/vision.service";

const router = Router();

// ─── All health routes require authentication ──────────────────────────────────
router.use(authMiddleware as any);

// ─── Inline schemas ───────────────────────────────────────────────────────────

const trendQuerySchema = z.object({
  from: z
    .string()
    .datetime({ message: "from must be ISO 8601 datetime" })
    .optional(),
  to: z
    .string()
    .datetime({ message: "to must be ISO 8601 datetime" })
    .optional(),
  groupBy: z.enum(["day", "week"]).default("day"),
});

const orgStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

const modelDebugQuerySchema = z
  .object({
    faceImageUrl: z.string().url().optional(),
    envImageUrl: z.string().url().optional(),
  })
  .refine((v) => Boolean(v.faceImageUrl || v.envImageUrl), {
    message: "At least one of faceImageUrl or envImageUrl is required.",
  });

// ─── Validation middleware ────────────────────────────────────────────────────

function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    validate(schema, req.query);
    next();
  };
}

// ─── Self-access guard ─────────────────────────────────────────────────────────
// Workers can only read their own health data.
// Supervisors and admins can read any worker's data.
function guardWorkerAccess(req: Request, _res: Response, next: NextFunction) {
  const role = req.user!.role;
  const userWorkerId = req.user!.workerId;
  const paramWorkerId = req.params.workerId;

  const isElevated = role === "admin" || role === "supervisor";
  if (!isElevated && userWorkerId !== paramWorkerId) {
    return next(new ForbiddenError("You can only access your own health records."));
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/health/org-summary
 * Returns today's latest check-in per worker for the heatmap widget.
 * Each entry includes workerId, site coordinates, riskLevel, and healthScore.
 * Supervisor+ only.
 *
 * IMPORTANT: Must be defined BEFORE /records/:workerId to avoid 'org-summary'
 * being captured as a :workerId param.
 */
router.get(
  "/org-summary",
  requireRole("supervisor"),
  asyncHandler(healthController.getOrgSummary)
);

/**
 * GET /api/v1/health/org-stats?days=30
 * Returns org-wide aggregate statistics for the past N days:
 *   - avgHealthScore, totalCheckins, ppeComplianceRate, alertRate
 *   - Breakdown by site and shift type
 * Supervisor+ only.
 */
router.get(
  "/org-stats",
  requireRole("supervisor"),
  validateQuery(orgStatsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { days } = validate(orgStatsQuerySchema, req.query);
    const orgId = req.user!.organizationId;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    const { resources } = await container.items
      .query({
        query: `SELECT c.shiftType, c.location.site,
                       c.visionAnalysis.face.hasHelmet,
                       c.visionAnalysis.face.hasMask,
                       c.mlAnalysis.healthScore,
                       c.mlAnalysis.riskLevel,
                       c.alertSent
                FROM c
                WHERE c.organizationId = @orgId AND c.timestamp >= @since`,
        parameters: [
          { name: "@orgId", value: orgId },
          { name: "@since", value: since.toISOString() },
        ],
      })
      .fetchAll();

    const records = resources as any[];
    const total = records.length;

    if (total === 0) {
      res.status(200).json({ data: null, message: "No check-ins found for this period." });
      return;
    }

    const avgScore = Math.round(
      records.reduce((sum, r) => sum + (r.healthScore ?? 0), 0) / total
    );
    const helmetCompliance = Math.round(
      (records.filter((r) => r.hasHelmet).length / total) * 100
    );
    const maskCompliance = Math.round(
      (records.filter((r) => r.hasMask).length / total) * 100
    );
    const alertRate = Math.round(
      (records.filter((r) => r.alertSent).length / total) * 100
    );
    const highRiskCount = records.filter(
      (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL"
    ).length;

    // Group by shift
    const byShift: Record<string, { count: number; totalScore: number }> = {};
    for (const r of records) {
      const s = r.shiftType ?? "unknown";
      if (!byShift[s]) byShift[s] = { count: 0, totalScore: 0 };
      byShift[s].count++;
      byShift[s].totalScore += r.healthScore ?? 0;
    }
    const shiftBreakdown = Object.entries(byShift).map(([shift, data]) => ({
      shift,
      checkins: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    // Group by site
    const bySite: Record<string, { count: number; totalScore: number }> = {};
    for (const r of records) {
      const s = r.site ?? "Unknown";
      if (!bySite[s]) bySite[s] = { count: 0, totalScore: 0 };
      bySite[s].count++;
      bySite[s].totalScore += r.healthScore ?? 0;
    }
    const siteBreakdown = Object.entries(bySite).map(([site, data]) => ({
      site,
      checkins: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    res.status(200).json({
      data: {
        period: `${days} days`,
        totalCheckins: total,
        avgHealthScore: avgScore,
        helmetComplianceRate: helmetCompliance,
        maskComplianceRate: maskCompliance,
        alertRate,
        highRiskCount,
        shiftBreakdown,
        siteBreakdown,
      },
    });
  })
);

/**
 * GET /api/v1/health/model-debug?faceImageUrl=...&envImageUrl=...
 * Returns normalized raw predictions from configured PPE and dust research endpoints.
 * Supervisor+ only. Intended for model calibration and threshold tuning.
 */
router.get(
  "/model-debug",
  requireRole("supervisor"),
  validateQuery(modelDebugQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { faceImageUrl, envImageUrl } = validate(modelDebugQuerySchema, req.query);
    const data = await getModelDebugPredictions({
      faceImageUrl,
      envImageUrl,
    });

    res.status(200).json({ data });
  })
);

/**
 * GET /api/v1/health/records/:workerId
 * Query: page, pageSize
 *
 * Returns paginated health check-in records for a worker, newest first.
 * Workers can only retrieve their own records.
 */
router.get(
  "/records/:workerId",
  guardWorkerAccess,
  validateQuery(paginationSchema),
  asyncHandler(healthController.getHealthRecords)
);

/**
 * GET /api/v1/health/records/:workerId/latest
 * Returns the single most recent check-in for a worker.
 * Used by the worker dashboard to display current risk status.
 *
 * IMPORTANT: Must be defined BEFORE /records/:workerId/:recordId to prevent
 * 'latest' being matched as a :recordId param.
 */
router.get(
  "/records/:workerId/latest",
  guardWorkerAccess,
  asyncHandler(healthController.getLatestRecord)
);

/**
 * GET /api/v1/health/records/:workerId/trend?from=ISO&to=ISO&groupBy=day|week
 * Returns daily or weekly average health scores for a date range.
 * Used to render the HealthTimeline chart.
 * Workers can only retrieve their own trend data.
 */
router.get(
  "/records/:workerId/trend",
  guardWorkerAccess,
  validateQuery(trendQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to, groupBy } = validate(trendQuerySchema, req.query);
    const workerId = req.params.workerId;

    const toDate = to ? new Date(to as string) : new Date();
    const fromDate = from
      ? new Date(from as string)
      : new Date(toDate.getTime() - 30 * 86400000); // default 30 days back

    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    const { resources } = await container.items
      .query({
        query: `SELECT c.timestamp, c.mlAnalysis.healthScore, c.mlAnalysis.riskLevel
                FROM c
                WHERE c.workerId = @workerId
                  AND c.timestamp >= @from
                  AND c.timestamp <= @to
                ORDER BY c.timestamp ASC`,
        parameters: [
          { name: "@workerId", value: workerId },
          { name: "@from", value: fromDate.toISOString() },
          { name: "@to", value: toDate.toISOString() },
        ],
      })
      .fetchAll();

    // Group by day or week
    const grouped: Record<string, number[]> = {};
    for (const rec of resources as any[]) {
      const date = new Date(rec.timestamp);
      let key: string;

      if (groupBy === "week") {
        // ISO week start (Monday)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = rec.timestamp.slice(0, 10);
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(rec.healthScore ?? 0);
    }

    const trend = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        checkins: scores.length,
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
      }));

    res.status(200).json({
      data: trend,
      meta: {
        workerId,
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
        groupBy,
        totalDataPoints: resources.length,
      },
    });
  })
);

/**
 * GET /api/v1/health/records/:workerId/:recordId
 * Returns the full detail of a single check-in record including
 * raw Vision analysis, ML analysis, and recommendations.
 * Workers can only retrieve their own records.
 */
router.get(
  "/records/:workerId/:recordId",
  guardWorkerAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { workerId, recordId } = req.params;

    if (!recordId.startsWith("chk_")) {
      throw new NotFoundError("Health record");
    }

    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    const { resource } = await container.item(recordId, workerId).read();

    if (!resource || resource.workerId !== workerId) {
      throw new NotFoundError("Health record");
    }

    res.status(200).json({ data: resource });
  })
);

export default router;
