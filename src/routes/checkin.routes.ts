/**
 * Check-in Routes — /api/v1/checkin
 *
 * Handles the full worker safety check-in lifecycle:
 *
 *   GET  /sas-url         Generate a write-only SAS URL for direct blob upload
 *   POST /                Full check-in pipeline (Vision → ML → Alert)
 *   GET  /:id             Retrieve a completed check-in by ID
 *   GET  /status/:id      Poll async check-in processing status
 *   POST /offline-sync    Batch-submit check-ins captured while offline
 *
 * All endpoints require a valid Azure AD B2C JWT.
 * POST / is also rate-limited to 10 submissions per worker per hour.
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { checkinRateLimit } from "../middleware/rateLimit.middleware";
import { asyncHandler, AppError, ValidationError } from "../utils/asyncHandler";
import { validate, checkinSchema } from "../utils/validators";
import * as checkinController from "../controllers/checkin.controller";

const router = Router();

// ─── All check-in routes require authentication ───────────────────────────────
router.use(authMiddleware as any);

// ─── Inline schemas ───────────────────────────────────────────────────────────

const sasUrlQuerySchema = z.object({
  type: z.enum(["face", "environment"], {
    errorMap: () => ({ message: "type must be 'face' or 'environment'" }),
  }),
  workerId: z.string().min(1, "workerId is required"),
});

const offlineSyncSchema = z.object({
  checkins: z
    .array(checkinSchema)
    .min(1, "At least one check-in entry is required")
    .max(10, "Maximum 10 offline check-ins per sync"),
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

/**
 * Ensures the requesting user can only submit check-ins for themselves
 * (workers) or for workers in their org (supervisors/admins).
 */
function assertCheckinOwnership(req: Request, _res: Response, next: NextFunction) {
  const bodyWorkerId: string = req.body?.workerId;
  const userWorkerId = req.user!.workerId;
  const role = req.user!.role;

  if (!bodyWorkerId) return next(); // validator will catch the missing field

  const isElevated = role === "admin" || role === "supervisor";
  if (!isElevated && userWorkerId !== bodyWorkerId) {
    return next(
      new AppError(
        "Workers can only submit check-ins for themselves.",
        403,
        "FORBIDDEN"
      )
    );
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/checkin/sas-url?type=face|environment&workerId=xxx
 *
 * Generates a short-lived write-only SAS URL so the client can upload an image
 * directly from the device to Azure Blob Storage — the image never passes
 * through this server. Expiry: 5 minutes.
 */
router.get(
  "/sas-url",
  validateQuery(sasUrlQuerySchema),
  asyncHandler(checkinController.getSasUrl)
);

/**
 * POST /api/v1/checkin
 * Body: CheckinInput (see validators.ts)
 *
 * Full pipeline:
 *   1. Validate input
 *   2. Verify worker ownership
 *   3. Parallel Azure AI Vision analysis (face + environment)
 *   4. Azure ML / rule-engine health scoring
 *   5. Generate personalised safety recommendations
 *   6. Persist HealthRecord to Cosmos DB
 *   7. Update worker health profile
 *   8. Create alert + notify if HIGH/CRITICAL risk
 *
 * Rate-limited: max 10 submissions per worker per hour.
 */
router.post(
  "/",
  checkinRateLimit,
  validateBody(checkinSchema),
  assertCheckinOwnership,
  asyncHandler(checkinController.submitCheckin)
);

/**
 * GET /api/v1/checkin/:id
 * Returns a completed check-in record by its ID.
 * Workers can only retrieve their own records; supervisors/admins can access any.
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const checkinId = req.params.id;

    if (!checkinId?.startsWith("chk_")) {
      throw new AppError(
        "Invalid check-in ID format. IDs begin with 'chk_'.",
        400,
        "INVALID_ID"
      );
    }

    // Delegate to the controller — it handles the Cosmos DB lookup + role check
    await checkinController.getCheckin(req, res);
  })
);

/**
 * GET /api/v1/checkin/status/:id
 * Polls the processing status of a check-in.
 * Useful if the frontend submitted the check-in and wants to show a
 * progress indicator while Vision + ML analysis is running asynchronously.
 *
 * Returns: { status: 'pending' | 'complete' | 'failed', result?: ... }
 */
router.get(
  "/status/:id",
  asyncHandler(async (req: Request, res: Response) => {
    // For the MVP the check-in pipeline is synchronous, so any stored record
    // is already 'complete'. This endpoint is a hook for future async processing.
    res.status(200).json({
      id: req.params.id,
      status: "complete",
      message:
        "Check-in processing is synchronous in the current version. " +
        "The record is ready immediately after POST /checkin returns.",
    });
  })
);

/**
 * POST /api/v1/checkin/offline-sync
 * Body: { checkins: CheckinInput[] }  (max 10 entries)
 *
 * Allows the mobile app to batch-submit check-ins that were captured
 * while the worker had no network connection. Each entry is processed
 * sequentially. Partial failures are reported per-entry.
 */
router.post(
  "/offline-sync",
  validateBody(offlineSyncSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { checkins } = req.body as { checkins: z.infer<typeof checkinSchema>[] };

    const results: { index: number; checkinId?: string; error?: string }[] = [];

    for (let i = 0; i < checkins.length; i++) {
      try {
        // Mutate req.body so the existing controller function reuses without change
        req.body = checkins[i];

        // Capture the response without sending — collect into results array
        let capturedBody: any = null;
        const proxyRes = {
          ...res,
          status: () => proxyRes,
          json: (body: any) => {
            capturedBody = body;
            return proxyRes;
          },
        } as any;

        await checkinController.submitCheckin(req, proxyRes);

        results.push({
          index: i,
          checkinId: capturedBody?.checkinId,
        });
      } catch (err: any) {
        results.push({
          index: i,
          error: err.message ?? "Unknown error",
        });
      }
    }

    const successful = results.filter((r) => r.checkinId).length;
    const failed = results.filter((r) => r.error).length;

    res.status(207).json({
      summary: { total: checkins.length, successful, failed },
      results,
    });
  })
);

export default router;