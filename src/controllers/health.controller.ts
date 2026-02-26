import { Request, Response } from "express";
import { healthRecordRepository } from "../services/cosmos.service";
import { validate, paginationSchema } from "../utils/validators";
import { ForbiddenError } from "../utils/asyncHandler";
import { getContainer, CONTAINERS } from "../config/azure.config";

/** GET /health/records/:workerId */
export async function getHealthRecords(req: Request, res: Response): Promise<void> {
  const { page, pageSize } = validate(paginationSchema, req.query);
  const workerId = req.params.workerId;

  // Workers can only access their own records
  if (req.user!.role === "worker" && req.user!.workerId !== workerId) {
    throw new ForbiddenError();
  }

  const { records, total } = await healthRecordRepository.listByWorker(workerId, page, pageSize);

  res.status(200).json({
    data: records,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}

/** GET /health/records/:workerId/latest — most recent check-in */
export async function getLatestRecord(req: Request, res: Response): Promise<void> {
  const workerId = req.params.workerId;

  if (req.user!.role === "worker" && req.user!.workerId !== workerId) {
    throw new ForbiddenError();
  }

  const { records } = await healthRecordRepository.listByWorker(workerId, 1, 1);

  res.status(200).json({ data: records[0] ?? null });
}

/** GET /health/org-summary — aggregate data for the org heatmap */
export async function getOrgSummary(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.organizationId;
  const container = getContainer(CONTAINERS.HEALTH_RECORDS);

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { resources } = await container.items
    .query({
      query: `SELECT c.workerId, c.location, c.mlAnalysis.riskLevel, c.mlAnalysis.healthScore
              FROM c WHERE c.organizationId = @orgId AND c.timestamp >= @since`,
      parameters: [
        { name: "@orgId", value: orgId },
        { name: "@since", value: since.toISOString() },
      ],
    })
    .fetchAll();

  // Latest record per worker (dedup)
  const latest: Record<string, any> = {};
  for (const rec of resources as any[]) {
    if (!latest[rec.workerId]) latest[rec.workerId] = rec;
  }

  res.status(200).json({ data: Object.values(latest) });
}