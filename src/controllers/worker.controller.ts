import { Request, Response } from "express";
import { workerRepository, healthRecordRepository } from "../services/cosmos.service";
import { validate, createWorkerSchema, updateWorkerSchema, paginationSchema } from "../utils/validators";
import { NotFoundError, ForbiddenError } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

/** GET /workers — list all workers in org */
export async function listWorkers(req: Request, res: Response): Promise<void> {
  const { page, pageSize } = validate(paginationSchema, req.query);
  const search = req.query.search as string | undefined;
  const orgId = req.user!.organizationId;

  const { workers, total } = await workerRepository.listByOrg(orgId, page, pageSize, search);

  res.status(200).json({
    data: workers,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}

/** GET /workers/:id — single worker detail */
export async function getWorker(req: Request, res: Response): Promise<void> {
  const worker = await workerRepository.findById(req.params.id);

  // Role check: workers can only see themselves
  const role = req.user!.role;
  if (role === "worker" && req.user!.workerId !== req.params.id) {
    throw new ForbiddenError("You can only view your own profile");
  }

  res.status(200).json({ data: worker });
}

/** GET /workers/:id/stats — health stats */
export async function getWorkerStats(req: Request, res: Response): Promise<void> {
  const workerId = req.params.id;

  // Self-check: workers can only see their own stats
  if (req.user!.role === "worker" && req.user!.workerId !== workerId) {
    throw new ForbiddenError();
  }

  const stats = await healthRecordRepository.getStats(workerId);
  if (!stats) {
    res.status(200).json({ data: null, message: "No check-ins found" });
    return;
  }

  res.status(200).json({ data: stats });
}

/** GET /workers/:id/history — paginated health records */
export async function getWorkerHistory(req: Request, res: Response): Promise<void> {
  const { page, pageSize } = validate(paginationSchema, req.query);

  if (req.user!.role === "worker" && req.user!.workerId !== req.params.id) {
    throw new ForbiddenError();
  }

  const { records, total } = await healthRecordRepository.listByWorker(
    req.params.id,
    page,
    pageSize
  );

  res.status(200).json({
    data: records,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}

/** POST /workers — create worker (admin only) */
export async function createWorker(req: Request, res: Response): Promise<void> {
  const input = validate(createWorkerSchema, req.body);

  // organizationId must match the admin's org
  if (input.organizationId !== req.user!.organizationId) {
    throw new ForbiddenError("Cannot create workers in another organization");
  }

  const worker = await workerRepository.create({
    ...input,
    azureUserId: req.body.azureUserId ?? "",
    deviceTokens: [],
  });

  logger.info("Worker created by admin", {
    newWorkerId: worker.workerId,
    adminId: req.user!.sub,
  });

  res.status(201).json({ data: worker });
}

/** PATCH /workers/:id — update worker */
export async function updateWorker(req: Request, res: Response): Promise<void> {
  const input = validate(updateWorkerSchema, req.body);
  const orgId = req.user!.organizationId;

  const updated = await workerRepository.update(req.params.id, input, orgId);
  logger.info("Worker updated", { workerId: req.params.id, by: req.user!.sub });

  res.status(200).json({ data: updated });
}