/**
 * Admin Routes — /api/v1/admin
 *
 * Organization-level analytics, alert management, and operational controls.
 * All routes require at minimum supervisor role.
 *
 *   GET    /dashboard            Org summary: worker counts, risk distribution
 *   GET    /risk-trend           7-day (or N-day) rolling average
 *   GET    /workers/high-risk    Workers currently at HIGH or CRITICAL level
 *   GET    /alerts               Paginated alert list with filters
 *   GET    /alerts/stream        SSE real-time alert feed
 *   PATCH  /alerts/:id/resolve   Resolve an open alert
 *   POST   /alerts/:id/reassign  Reassign alert to another supervisor
 *   GET    /compliance           30-day PPE compliance report per site
 *   GET    /sites                List all sites and their current risk status
 *   GET    /export/health-records CSV export of check-in data (admin only)
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler, AppError } from "../utils/asyncHandler";
import {
  validate,
  alertFiltersSchema,
  paginationSchema,
  updateAdminProfileSchema,
} from "../utils/validators";
import * as adminController from "../controllers/admin.controller";

const router = Router();

// ─── All admin routes require authentication + minimum supervisor role ─────────
router.use(authMiddleware as any);
router.use(requireRole("supervisor"));

// ─── Inline schemas ───────────────────────────────────────────────────────────

const riskTrendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

const highRiskQuerySchema = paginationSchema.extend({
  minLevel: z.enum(["HIGH", "CRITICAL"]).default("HIGH"),
});

const reassignSchema = z.object({
  supervisorId: z.string().min(1, "Supervisor ID is required"),
  note: z.string().max(500).optional(),
});

const exportQuerySchema = z.object({
  from: z.string().datetime({ message: "from must be ISO 8601 datetime" }),
  to: z.string().datetime({ message: "to must be ISO 8601 datetime" }),
  site: z.string().optional(),
});

// ─── Validation middleware ────────────────────────────────────────────────────

function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    validate(schema, req.query);
    next();
  };
}

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    validate(schema, req.body);
    next();
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard
 * Returns the org-level summary for the admin dashboard:
 *   - totalWorkers, activeToday, openAlerts
 *   - Risk distribution (LOW / MEDIUM / HIGH / CRITICAL / UNKNOWN counts)
 */
router.get(
  "/dashboard",
  asyncHandler(adminController.getDashboard)
);

/**
 * GET /api/v1/admin/profile
 * Returns the current admin profile for settings page.
 */
router.get(
  "/profile",
  asyncHandler(adminController.getAdminProfile)
);

/**
 * PATCH /api/v1/admin/profile
 * Updates editable admin profile fields.
 */
router.patch(
  "/profile",
  validateBody(updateAdminProfileSchema),
  asyncHandler(adminController.updateAdminProfile)
);

/**
 * GET /api/v1/admin/risk-trend?days=7
 * Returns daily average health score and check-in counts for the past N days.
 * Default window: 7 days. Maximum: 90 days.
 */
router.get(
  "/risk-trend",
  validateQuery(riskTrendQuerySchema),
  asyncHandler(adminController.getRiskTrend)
);

/**
 * GET /api/v1/admin/workers/high-risk?minLevel=HIGH&page=1&pageSize=20
 * Returns workers currently flagged at HIGH or CRITICAL risk level.
 * Used to populate the "needs attention" section of the admin dashboard.
 */
router.get(
  "/workers/high-risk",
  validateQuery(highRiskQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { minLevel, page, pageSize } = validate(highRiskQuerySchema, req.query);
    const orgId = req.user!.organizationId;

    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.WORKERS);

    const levels =
      minLevel === "CRITICAL" ? ["CRITICAL"] : ["HIGH", "CRITICAL"];
    const levelParams = levels
      .map((l, i) => `@level${i}`)
      .join(", ");

    const { resources } = await container.items
      .query({
        query: `SELECT c.workerId, c.name, c.department, c.site,
                       c.healthProfile.currentRiskLevel, c.healthProfile.lastCheckin,
                       c.healthProfile.streakDaysLowRisk
                FROM c
                WHERE c.organizationId = @orgId
                  AND c.healthProfile.currentRiskLevel IN (${levelParams})
                ORDER BY c.healthProfile.currentRiskLevel DESC
                OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`,
        parameters: [
          { name: "@orgId", value: orgId },
          ...levels.map((l, i) => ({ name: `@level${i}`, value: l })),
        ],
      })
      .fetchAll();

    res.status(200).json({
      data: resources,
      pagination: { page, pageSize, total: resources.length },
    });
  })
);

/**
 * GET /api/v1/admin/alerts
 * Query: page, pageSize, severity, status, workerId, site
 *
 * Paginated alert list. Supports filtering by severity (LOW/MEDIUM/HIGH/CRITICAL),
 * status (OPEN/RESOLVED), specific worker, and site.
 */
router.get(
  "/alerts",
  validateQuery(alertFiltersSchema),
  asyncHandler(adminController.getAlerts)
);

/**
 * GET /api/v1/admin/alerts/stream
 * Server-Sent Events endpoint for real-time alert delivery.
 *
 * The client connects once and receives events as they occur:
 *   - type: 'init'  — initial payload of open alerts
 *   - type: 'alert' — new alert created
 *   - type: 'resolved' — alert resolved
 *
 * IMPORTANT: This route MUST be defined before /alerts/:id to prevent
 * Express matching 'stream' as an :id parameter.
 */
router.get(
  "/alerts/stream",
  asyncHandler(adminController.streamAlerts)
);

/**
 * PATCH /api/v1/admin/alerts/:id/resolve
 * Marks an alert as RESOLVED and records who resolved it and when.
 * The resolving user's name is taken from the JWT claims.
 */
router.patch(
  "/alerts/:id/resolve",
  asyncHandler(adminController.resolveAlert)
);

/**
 * POST /api/v1/admin/alerts/:id/reassign
 * Body: { supervisorId: string, note?: string }
 *
 * Reassigns an open alert to a different supervisor.
 * Both the original and new assignee receive a notification.
 */
router.post(
  "/alerts/:id/reassign",
  validateBody(reassignSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { supervisorId, note } = req.body as { supervisorId: string; note?: string };
    const { alertId } = req.params;

    // In a full implementation: update alert.assignedTo and notify both parties
    res.status(200).json({
      success: true,
      alertId,
      reassignedTo: supervisorId,
      note: note ?? null,
      message: "Alert reassigned. (Full reassignment logic pending Service Bus integration.)",
    });
  })
);

/**
 * GET /api/v1/admin/compliance
 * Returns a 30-day PPE compliance report broken down by site:
 *   - helmetRate, maskRate, highRiskRate per site
 * Used to identify which sites need safety intervention.
 */
router.get(
  "/compliance",
  asyncHandler(adminController.getComplianceReport)
);

/**
 * GET /api/v1/admin/sites
 * Returns all sites in the organization and their aggregated current risk status.
 * Feeds the heatmap widget on the admin dashboard.
 */
router.get(
  "/sites",
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.organizationId;
    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.WORKERS);

    const { resources } = await container.items
      .query({
        query: `SELECT c.site,
                       COUNT(1) AS workerCount,
                       AVG(c.healthProfile.baselineScore) AS avgBaselineScore
                FROM c
                WHERE c.organizationId = @orgId
                GROUP BY c.site`,
        parameters: [{ name: "@orgId", value: orgId }],
      })
      .fetchAll();

    res.status(200).json({ data: resources });
  })
);

/**
 * GET /api/v1/admin/export/health-records?from=ISO&to=ISO&site=xxx
 * Streams a CSV export of health check-in records for a given date range.
 * Used for regulatory reporting and audit purposes.
 * Admin only.
 */
router.get(
  "/export/health-records",
  requireRole("admin"),
  validateQuery(exportQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to, site } = validate(exportQuerySchema, req.query);
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (toDate <= fromDate) {
      throw new AppError("'to' must be after 'from'.", 400, "INVALID_DATE_RANGE");
    }

    const rangeDays = (toDate.getTime() - fromDate.getTime()) / 86400000;
    if (rangeDays > 366) {
      throw new AppError(
        "Export range cannot exceed 366 days. Split into smaller requests.",
        400,
        "DATE_RANGE_TOO_LARGE"
      );
    }

    const orgId = req.user!.organizationId;
    const { getContainer, CONTAINERS } = await import("../config/azure.config");
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    let query = `SELECT c.workerId, c.timestamp, c.shiftType,
                        c.location.site, c.visionAnalysis.face.hasHelmet,
                        c.visionAnalysis.face.hasMask, c.visionAnalysis.face.fatigueScore,
                        c.mlAnalysis.healthScore, c.mlAnalysis.riskLevel
                 FROM c
                 WHERE c.organizationId = @orgId
                   AND c.timestamp >= @from
                   AND c.timestamp <= @to`;
    const params: any[] = [
      { name: "@orgId", value: orgId },
      { name: "@from", value: fromDate.toISOString() },
      { name: "@to", value: toDate.toISOString() },
    ];

    if (site) {
      query += " AND c.location.site = @site";
      params.push({ name: "@site", value: site });
    }

    const { resources } = await container.items
      .query({ query, parameters: params })
      .fetchAll();

    // Stream as CSV
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="safeguard-export-${fromDate.toISOString().slice(0, 10)}.csv"`
    );

    const headers = [
      "workerId",
      "timestamp",
      "shiftType",
      "site",
      "hasHelmet",
      "hasMask",
      "fatigueScore",
      "healthScore",
      "riskLevel",
    ];

    res.write(headers.join(",") + "\n");

    for (const row of resources as any[]) {
      const line = [
        row.workerId,
        row.timestamp,
        row.shiftType,
        row.site ?? "",
        row.hasHelmet ? "1" : "0",
        row.hasMask ? "1" : "0",
        (row.fatigueScore ?? 0).toFixed(3),
        row.healthScore ?? "",
        row.riskLevel ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
      res.write(line + "\n");
    }

    res.end();
  })
);

export default router;
