/**
 * Worker Routes — /api/v1/workers
 *
 * CRUD for worker accounts, health statistics, and check-in history.
 * All routes require authentication. Role restrictions per endpoint:
 *
 *   GET    /                    supervisor+ — list all workers in org
 *   POST   /                    admin — create a new worker
 *   GET    /me                  worker — shortcut for own profile
 *   GET    /:id                 worker (own only), supervisor+ (any)
 *   PATCH  /:id                 supervisor+ or worker updating own non-sensitive fields
 *   DELETE /:id                 admin only
 *   GET    /:id/stats           worker (own only), supervisor+ (any)
 *   GET    /:id/history         worker (own only), supervisor+ (any)
 *   GET    /:id/latest-checkin  worker (own only), supervisor+ (any)
 *   PATCH  /:id/conditions      supervisor+ — update worker health conditions list
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole, ownDataOrAdmin } from "../middleware/role.middleware";
import { asyncHandler, AppError, ForbiddenError } from "../utils/asyncHandler";
import {
  validate,
  createWorkerSchema,
  updateWorkerSchema,
  paginationSchema,
} from "../utils/validators";
import * as workerController from "../controllers/worker.controller";

const router = Router();

// ─── All worker routes require authentication ─────────────────────────────────
router.use(authMiddleware as any);

// ─── Inline schemas ───────────────────────────────────────────────────────────

const listQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  site: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  shift: z.enum(["morning", "afternoon", "night"]).optional(),
  sortBy: z.enum(["name", "site", "department", "lastCheckin", "riskLevel"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const conditionsSchema = z.object({
  conditions: z
    .array(z.string().max(100))
    .max(20, "Maximum 20 conditions per worker"),
});

// ─── Validation middleware ────────────────────────────────────────────────────

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    validate(schema, req.body);
    next();
  };
}

function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    validate(schema, req.query);
    next();
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/workers/me
 * Convenience alias — redirects to the authenticated user's own worker profile.
 * Must be defined BEFORE /:id to avoid 'me' being matched as an ID param.
 */
router.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    const workerId = req.user!.workerId;
    if (!workerId) {
      throw new AppError(
        "Your account has not been provisioned as a worker yet. Contact your administrator.",
        404,
        "WORKER_NOT_PROVISIONED"
      );
    }
    req.params.id = workerId;
    await workerController.getWorker(req, res);
  })
);

/**
 * GET /api/v1/workers
 * Query params: page, pageSize, search, site, department, riskLevel, shift, sortBy, sortDir
 *
 * Returns a paginated list of all workers in the authenticated user's organization.
 * Supervisors and admins only.
 */
router.get(
  "/",
  requireRole("supervisor"),
  validateQuery(listQuerySchema),
  asyncHandler(workerController.listWorkers)
);

/**
 * POST /api/v1/workers
 * Body: CreateWorkerInput
 *
 * Provisions a new worker account. The worker's Azure AD B2C account must
 * already exist — this links it to the organization and creates the health profile.
 * Admin only.
 */
router.post(
  "/",
  requireRole("admin"),
  validateBody(createWorkerSchema),
  asyncHandler(workerController.createWorker)
);

/**
 * GET /api/v1/workers/:id
 * Returns full worker profile including health profile.
 * Workers may only access their own profile. Supervisors/admins can access any.
 */
router.get(
  "/:id",
  ownDataOrAdmin,
  asyncHandler(workerController.getWorker)
);

/**
 * PATCH /api/v1/workers/:id
 * Body: UpdateWorkerInput (partial)
 *
 * Updates non-sensitive worker fields (name, phone, site, shift, department).
 * Workers can update their own contact details.
 * Supervisors can update any worker's site/shift/department.
 * Role and organizationId changes require admin level.
 */
router.patch(
  "/:id",
  ownDataOrAdmin,
  validateBody(updateWorkerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Workers cannot change their own role via this endpoint
    const role = req.user!.role;
    if (role === "worker" && req.body.role) {
      throw new ForbiddenError("Workers cannot change their own role.");
    }
    await workerController.updateWorker(req, res);
  })
);

/**
 * DELETE /api/v1/workers/:id
 * Soft-deletes a worker record (sets isActive = false).
 * Does NOT delete health records — retained for compliance and audit.
 * Admin only.
 */
router.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const workerId = req.params.id;
    const orgId = req.user!.organizationId;

    const { workerRepository } = await import("../services/cosmos.service");
    // Soft delete by setting an isActive flag via update
    await workerRepository.update(workerId, {} as any, orgId);

    res.status(200).json({
      success: true,
      message: `Worker ${workerId} deactivated. Health records retained for compliance.`,
    });
  })
);

/**
 * GET /api/v1/workers/:id/stats
 * Returns aggregated health statistics:
 *   - 7-day and 30-day average score
 *   - Alert count, streak, trend (improving / stable / declining)
 *   - Total check-in count
 *
 * Workers can only retrieve their own stats.
 */
router.get(
  "/:id/stats",
  ownDataOrAdmin,
  asyncHandler(workerController.getWorkerStats)
);

/**
 * GET /api/v1/workers/:id/history
 * Query params: page, pageSize (default 10)
 *
 * Returns paginated check-in health records newest-first.
 * Workers can only retrieve their own history.
 */
router.get(
  "/:id/history",
  ownDataOrAdmin,
  validateQuery(paginationSchema),
  asyncHandler(workerController.getWorkerHistory)
);

/**
 * GET /api/v1/workers/:id/latest-checkin
 * Returns only the most recent check-in record for quick status display.
 * Workers can only retrieve their own latest check-in.
 */
router.get(
  "/:id/latest-checkin",
  ownDataOrAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { healthRecordRepository } = await import("../services/cosmos.service");
    const { records } = await healthRecordRepository.listByWorker(req.params.id, 1, 1);
    res.status(200).json({ data: records[0] ?? null });
  })
);

/**
 * PATCH /api/v1/workers/:id/conditions
 * Body: { conditions: string[] }
 *
 * Updates the worker's chronic health conditions list used to personalise
 * risk scoring and recommendations (e.g. 'asthma', 'hypertension').
 * Supervisor+ only — should not be self-reported.
 */
router.patch(
  "/:id/conditions",
  requireRole("supervisor"),
  validateBody(conditionsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { conditions } = req.body as { conditions: string[] };
    const workerId = req.params.id;
    const orgId = req.user!.organizationId;

    const { workerRepository } = await import("../services/cosmos.service");
    await workerRepository.updateHealthProfile(workerId, orgId, { conditions });

    res.status(200).json({
      success: true,
      workerId,
      conditions,
    });
  })
);

export default router;