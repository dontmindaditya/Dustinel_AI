import { v4 as uuidv4 } from "uuid";
import { getContainer, CONTAINERS } from "../config/azure.config";
import { logger } from "../utils/logger";
import { NotFoundError } from "../utils/asyncHandler";
import type { Worker, WorkerSummary, CreateWorkerInput, UpdateWorkerInput } from "../models/worker.model";
import type { HealthRecord, CreateHealthRecordInput } from "../models/healthRecord.model";
import type { Alert, CreateAlertInput, AlertStatus } from "../models/alert.model";

// ─── WORKERS ──────────────────────────────────────────────────────────────────

export const workerRepository = {
  async findById(workerId: string): Promise<Worker> {
    const container = getContainer(CONTAINERS.WORKERS);
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.workerId = @workerId",
        parameters: [{ name: "@workerId", value: workerId }],
      })
      .fetchAll();

    if (!resources.length) throw new NotFoundError("Worker");
    return resources[0] as Worker;
  },

  async findByAzureUserId(azureUserId: string): Promise<Worker | null> {
    const container = getContainer(CONTAINERS.WORKERS);
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.azureUserId = @azureUserId",
        parameters: [{ name: "@azureUserId", value: azureUserId }],
      })
      .fetchAll();

    return resources.length ? (resources[0] as Worker) : null;
  },

  async listByOrg(
    organizationId: string,
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<{ workers: WorkerSummary[]; total: number }> {
    const container = getContainer(CONTAINERS.WORKERS);

    let query = `SELECT c.workerId, c.name, c.department, c.site,
      c.healthProfile.currentRiskLevel, c.healthProfile.lastCheckin
      FROM c WHERE c.organizationId = @orgId`;
    const params: any[] = [{ name: "@orgId", value: organizationId }];

    if (search) {
      query += ` AND (CONTAINS(LOWER(c.name), @search) OR CONTAINS(LOWER(c.department), @search) OR CONTAINS(LOWER(c.site), @search))`;
      params.push({ name: "@search", value: search.toLowerCase() });
    }

    const countQuery = query.replace(/SELECT.+?FROM c/, "SELECT VALUE COUNT(1) FROM c");

    const [dataRes, countRes] = await Promise.all([
      container.items
        .query({ query: query + ` OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`, parameters: params })
        .fetchAll(),
      container.items.query({ query: countQuery, parameters: params }).fetchAll(),
    ]);

    const workers: WorkerSummary[] = dataRes.resources.map((w: any) => ({
      workerId: w.workerId,
      name: w.name,
      department: w.department,
      site: w.site,
      currentRiskLevel: w.currentRiskLevel ?? null,
      lastCheckin: w.lastCheckin ?? null,
      healthScore: null, // loaded separately if needed
    }));

    return { workers, total: countRes.resources[0] ?? 0 };
  },

  async create(input: CreateWorkerInput): Promise<Worker> {
    const container = getContainer(CONTAINERS.WORKERS);
    const workerId = `worker_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const worker: Worker = {
      id: workerId,
      workerId,
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role ?? "worker",
      department: input.department,
      site: input.site,
      shift: input.shift,
      azureUserId: input.azureUserId,
      deviceTokens: input.deviceTokens ?? [],
      healthProfile: {
        baselineScore: 85,
        conditions: [],
        lastCheckin: null,
        currentRiskLevel: null,
        streakDaysLowRisk: 0,
        ...input.healthProfile,
      },
      createdAt: now,
      updatedAt: now,
    };

    await container.items.create(worker);
    logger.info("Worker created", { workerId });
    return worker;
  },

  async update(workerId: string, input: UpdateWorkerInput, organizationId: string): Promise<Worker> {
    const existing = await this.findById(workerId);
    const updated: Worker = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const container = getContainer(CONTAINERS.WORKERS);
    await container.item(existing.id, organizationId).replace(updated);
    return updated;
  },

  async updateHealthProfile(
    workerId: string,
    organizationId: string,
    patch: Partial<Worker["healthProfile"]>
  ): Promise<void> {
    const existing = await this.findById(workerId);
    const updated: Worker = {
      ...existing,
      healthProfile: { ...existing.healthProfile, ...patch },
      updatedAt: new Date().toISOString(),
    };

    const container = getContainer(CONTAINERS.WORKERS);
    await container.item(existing.id, organizationId).replace(updated);
  },
};

// ─── HEALTH RECORDS ───────────────────────────────────────────────────────────

export const healthRecordRepository = {
  async create(input: CreateHealthRecordInput & { alertSent: boolean; alertId: string | null }): Promise<HealthRecord> {
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);
    const id = `chk_${uuidv4().slice(0, 12)}`;

    const record: HealthRecord = {
      ...input,
      id,
      timestamp: input.timestamp ?? new Date().toISOString(),
      alertSent: input.alertSent,
      alertId: input.alertId,
      ttl: 63072000, // 2 years
    };

    await container.items.create(record);
    return record;
  },

  async listByWorker(
    workerId: string,
    page = 1,
    pageSize = 10
  ): Promise<{ records: HealthRecord[]; total: number }> {
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    const [dataRes, countRes] = await Promise.all([
      container.items
        .query({
          query: `SELECT * FROM c WHERE c.workerId = @workerId ORDER BY c.timestamp DESC OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`,
          parameters: [{ name: "@workerId", value: workerId }],
        })
        .fetchAll(),
      container.items
        .query({
          query: "SELECT VALUE COUNT(1) FROM c WHERE c.workerId = @workerId",
          parameters: [{ name: "@workerId", value: workerId }],
        })
        .fetchAll(),
    ]);

    return {
      records: dataRes.resources as HealthRecord[],
      total: countRes.resources[0] ?? 0,
    };
  },

  async getStats(workerId: string) {
    const container = getContainer(CONTAINERS.HEALTH_RECORDS);

    const { resources } = await container.items
      .query({
        query: `SELECT c.mlAnalysis.healthScore, c.mlAnalysis.riskLevel, c.alertSent, c.timestamp
                FROM c WHERE c.workerId = @workerId ORDER BY c.timestamp DESC OFFSET 0 LIMIT 30`,
        parameters: [{ name: "@workerId", value: workerId }],
      })
      .fetchAll();

    if (!resources.length) return null;

    const scores = resources.map((r: any) => r.healthScore as number);
    const last7 = scores.slice(0, 7);
    const last30 = scores;
    const alertCount = resources.filter((r: any) => r.alertSent).length;

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const recent = scores.slice(0, 3);
    const older = scores.slice(3, 6);
    const trend =
      recent.length && older.length
        ? avg(recent) > avg(older)
          ? "improving"
          : avg(recent) < avg(older)
          ? "declining"
          : "stable"
        : "stable";

    return {
      avgScore7Days: avg(last7),
      avgScore30Days: avg(last30),
      alertCount7Days: alertCount,
      totalCheckins: resources.length,
      streakDaysLowRisk: 0, // computed separately
      trend,
    };
  },
};

// ─── ALERTS ───────────────────────────────────────────────────────────────────

export const alertRepository = {
  async create(input: CreateAlertInput): Promise<Alert> {
    const container = getContainer(CONTAINERS.ALERTS);
    const id = `alert_${uuidv4().slice(0, 12)}`;

    const alert: Alert = {
      ...input,
      id,
      timestamp: new Date().toISOString(),
      status: "OPEN",
      resolvedBy: null,
      resolvedAt: null,
      notificationsSent: [],
    };

    await container.items.create(alert);
    return alert;
  },

  async list(
    organizationId: string,
    filters: {
      severity?: string;
      status?: AlertStatus;
      workerId?: string;
      site?: string;
    },
    page = 1,
    pageSize = 20
  ): Promise<{ alerts: Alert[]; total: number }> {
    const container = getContainer(CONTAINERS.ALERTS);
    let query = "SELECT * FROM c WHERE c.organizationId = @orgId";
    const params: any[] = [{ name: "@orgId", value: organizationId }];

    if (filters.severity) {
      query += " AND c.severity = @severity";
      params.push({ name: "@severity", value: filters.severity });
    }
    if (filters.status) {
      query += " AND c.status = @status";
      params.push({ name: "@status", value: filters.status });
    }
    if (filters.workerId) {
      query += " AND c.workerId = @workerId";
      params.push({ name: "@workerId", value: filters.workerId });
    }
    if (filters.site) {
      query += " AND c.site = @site";
      params.push({ name: "@site", value: filters.site });
    }

    query += ` ORDER BY c.timestamp DESC OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`;
    const countQuery = query.replace(/SELECT \*.+?FROM c/, "SELECT VALUE COUNT(1) FROM c").replace(/ORDER BY.+$/, "");

    const [dataRes, countRes] = await Promise.all([
      container.items.query({ query, parameters: params }).fetchAll(),
      container.items.query({ query: countQuery, parameters: params }).fetchAll(),
    ]);

    return {
      alerts: dataRes.resources as Alert[],
      total: countRes.resources[0] ?? 0,
    };
  },

  async resolve(alertId: string, resolvedBy: string, organizationId: string): Promise<Alert> {
    const container = getContainer(CONTAINERS.ALERTS);
    const { resource: existing } = await container.item(alertId, organizationId).read<Alert>();

    if (!existing) throw new NotFoundError("Alert");

    const updated: Alert = {
      ...existing,
      status: "RESOLVED",
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };

    await container.item(alertId, organizationId).replace(updated);
    return updated;
  },

  async getLastAlertTime(workerId: string, alertType: string): Promise<Date | null> {
    const container = getContainer(CONTAINERS.ALERTS);
    const { resources } = await container.items
      .query({
        query: `SELECT c.timestamp FROM c
                WHERE c.workerId = @workerId AND c.type = @type
                ORDER BY c.timestamp DESC OFFSET 0 LIMIT 1`,
        parameters: [
          { name: "@workerId", value: workerId },
          { name: "@type", value: alertType },
        ],
      })
      .fetchAll();

    return resources.length ? new Date(resources[0].timestamp) : null;
  },
};