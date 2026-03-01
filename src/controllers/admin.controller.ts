import { Request, Response } from "express";
import {
  workerRepository,
  alertRepository,
  healthRecordRepository,
  adminProfileRepository,
} from "../services/cosmos.service";
import {
  validate,
  alertFiltersSchema,
  paginationSchema,
  updateAdminProfileSchema,
} from "../utils/validators";
import { getContainer, CONTAINERS } from "../config/azure.config";
import { logger } from "../utils/logger";
import type { RiskLevel } from "../models/worker.model";

/** GET /admin/dashboard — org-level summary stats */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const container = getContainer(CONTAINERS.WORKERS);

  // Workers by risk level
  const [workersRes, alertsRes] = await Promise.all([
    container.items
      .query({
        query: `SELECT c.healthProfile.currentRiskLevel, c.healthProfile.lastCheckin
                FROM c WHERE c.organizationId = @orgId`,
        parameters: [{ name: "@orgId", value: orgId }],
      })
      .fetchAll(),
    alertRepository.list(orgId, { status: "OPEN" }, 1, 100),
  ]);

  const workers = workersRes.resources as any[];
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

  const totalWorkers = workers.length;
  const activeToday = workers.filter(
    (w) => w.lastCheckin && w.lastCheckin >= todayStart
  ).length;

  const riskCounts: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
    UNKNOWN: 0,
  };

  for (const w of workers) {
    const lvl = w.currentRiskLevel ?? "UNKNOWN";
    riskCounts[lvl] = (riskCounts[lvl] ?? 0) + 1;
  }

  res.status(200).json({
    data: {
      totalWorkers,
      activeToday,
      openAlerts: alertsRes.total,
      riskDistribution: riskCounts,
    },
  });
}

/** GET /admin/risk-trend — 7-day rolling average for org */
export async function getRiskTrend(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const days = Math.min(Number(req.query.days ?? 7), 30);
  const container = getContainer(CONTAINERS.HEALTH_RECORDS);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { resources } = await container.items
    .query({
      query: `SELECT c.timestamp, c.mlAnalysis.healthScore, c.mlAnalysis.riskLevel
              FROM c WHERE c.organizationId = @orgId AND c.timestamp >= @since
              ORDER BY c.timestamp ASC`,
      parameters: [
        { name: "@orgId", value: orgId },
        { name: "@since", value: since.toISOString() },
      ],
    })
    .fetchAll();

  // Group by day
  const byDay: Record<string, number[]> = {};
  for (const rec of resources as any[]) {
    const day = rec.timestamp.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(rec.healthScore);
  }

  const trend = Object.entries(byDay).map(([date, scores]) => ({
    date,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    checkins: scores.length,
  }));

  res.status(200).json({ data: trend });
}

/** GET /admin/alerts — paginated alert list */
export async function getAlerts(req: Request, res: Response): Promise<void> {
  const filters = validate(alertFiltersSchema, req.query);
  const orgId = req.user!.organizationId;

  const { alerts, total } = await alertRepository.list(
    orgId,
    {
      severity: filters.severity,
      status: filters.status,
      workerId: filters.workerId,
      site: filters.site,
    },
    filters.page,
    filters.pageSize
  );

  res.status(200).json({
    data: alerts,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      pages: Math.ceil(total / filters.pageSize),
    },
  });
}

/** PATCH /admin/alerts/:id/resolve */
export async function resolveAlert(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const resolvedBy = req.user!.name || req.user!.email;

  const updated = await alertRepository.resolve(req.params.id, resolvedBy, orgId);

  logger.info("Alert resolved", {
    alertId: req.params.id,
    resolvedBy,
  });

  res.status(200).json({ data: updated });
}

/** GET /admin/compliance — site-level compliance summary */
export async function getComplianceReport(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const container = getContainer(CONTAINERS.HEALTH_RECORDS);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { resources } = await container.items
    .query({
      query: `SELECT c.location.site,
                     c.visionAnalysis.face.hasHelmet,
                     c.visionAnalysis.face.hasMask,
                     c.mlAnalysis.riskLevel
              FROM c
              WHERE c.organizationId = @orgId AND c.timestamp >= @since`,
      parameters: [
        { name: "@orgId", value: orgId },
        { name: "@since", value: since.toISOString() },
      ],
    })
    .fetchAll();

  const bySite: Record<
    string,
    { total: number; helmetCompliant: number; maskCompliant: number; highRisk: number }
  > = {};

  for (const rec of resources as any[]) {
    const site = rec.site ?? "Unknown";
    if (!bySite[site]) {
      bySite[site] = { total: 0, helmetCompliant: 0, maskCompliant: 0, highRisk: 0 };
    }
    bySite[site].total++;
    if (rec.hasHelmet) bySite[site].helmetCompliant++;
    if (rec.hasMask) bySite[site].maskCompliant++;
    if (rec.riskLevel === "HIGH" || rec.riskLevel === "CRITICAL") bySite[site].highRisk++;
  }

  const report = Object.entries(bySite).map(([site, stats]) => ({
    site,
    ...stats,
    helmetRate: Math.round((stats.helmetCompliant / stats.total) * 100),
    maskRate: Math.round((stats.maskCompliant / stats.total) * 100),
    highRiskRate: Math.round((stats.highRisk / stats.total) * 100),
  }));

  res.status(200).json({ data: report, period: "30 days" });
}

/**
 * GET /admin/alerts/stream — SSE endpoint for real-time alert feed
 */
export async function streamAlerts(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat every 25s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  // In production, this would subscribe to an Azure Service Bus / Event Hub
  // and push events as they arrive. For MVP, we just send the initial open alerts.
  const { alerts } = await alertRepository.list(orgId, { status: "OPEN" }, 1, 20);
  res.write(`data: ${JSON.stringify({ type: "init", alerts })}\n\n`);

  req.on("close", () => {
    clearInterval(heartbeat);
    logger.debug("SSE client disconnected", { orgId });
  });
}

/** GET /admin/profile â€” profile fields for admin settings */
export async function getAdminProfile(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const adminUserId = req.user!.sub;
  const profile = await adminProfileRepository.upsert(
    orgId,
    adminUserId,
    {
      fullName: req.user!.name || "Admin User",
      email: req.user!.email || "",
    }
  );

  res.status(200).json({ data: profile });
}

/** PATCH /admin/profile â€” update editable admin profile fields */
export async function updateAdminProfile(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const adminUserId = req.user!.sub;
  const input = validate(updateAdminProfileSchema, req.body);

  const updated = await adminProfileRepository.upsert(
    orgId,
    adminUserId,
    {
      fullName: req.user!.name || "Admin User",
      email: req.user!.email || "",
    },
    input
  );

  res.status(200).json({ data: updated });
}
