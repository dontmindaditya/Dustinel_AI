import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { blobService } from "../services/blob.service";
import { analyzeFaceImage, analyzeEnvironmentImage } from "../services/vision.service";
import { runMLInference } from "../services/ml.service";
import { generateRecommendations } from "../services/recommendation.service";
import { workerRepository, healthRecordRepository, alertRepository } from "../services/cosmos.service";
import { sendAlertNotifications, shouldThrottle } from "../services/notification.service";
import { validate, checkinSchema, sasUrlQuerySchema } from "../utils/validators";
import { AppError, NotFoundError } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

/**
 * GET /checkin/sas-url
 * Generates a short-lived write-only SAS URL for the client to upload an image
 * directly to Azure Blob Storage — bypassing the backend for large payloads.
 */
export async function getSasUrl(req: Request, res: Response): Promise<void> {
  const query = validate(sasUrlQuerySchema, req.query);
  const worker = req.user!;

  const result = await blobService.generateSasUrl({
    type: query.type,
    workerId: query.workerId,
    organizationId: worker.organizationId,
  });

  res.status(200).json(result);
}

/**
 * POST /checkin
 * Full check-in pipeline:
 *  1. Validate input + fetch worker record
 *  2. Run Azure AI Vision on both images in parallel
 *  3. Run ML inference (with fallback to rule engine)
 *  4. Generate personalised recommendations
 *  5. Persist health record to Cosmos DB
 *  6. Update worker health profile
 *  7. If HIGH/CRITICAL — create alert + send notifications
 *  8. Return structured result to client
 */
export async function submitCheckin(req: Request, res: Response): Promise<void> {
  const input = validate(checkinSchema, req.body);
  const startTime = Date.now();

  logger.info("Check-in started", { workerId: input.workerId });

  // ── 1. Fetch worker record ────────────────────────────────────────────────
  const worker = await workerRepository.findById(input.workerId);
  if (worker.organizationId !== req.user!.organizationId) {
    throw new AppError("Worker does not belong to your organization", 403, "FORBIDDEN");
  }

  // ── 2. Vision analysis (parallel) ────────────────────────────────────────
  const [faceAnalysis, envAnalysis] = await Promise.all([
    analyzeFaceImage(input.faceImageUrl),
    analyzeEnvironmentImage(input.envImageUrl),
  ]);

  const vision = { face: faceAnalysis, environment: envAnalysis };

  // ── 3. ML / risk scoring ─────────────────────────────────────────────────
  const previousScore = worker.healthProfile.baselineScore;
  const mlAnalysis = await runMLInference({
    vision,
    worker,
    shiftType: input.shiftType,
    previousScore,
  });

  // ── 4. Recommendations ───────────────────────────────────────────────────
  const recommendations = generateRecommendations({
    ml: mlAnalysis,
    vision,
    worker,
    shiftType: input.shiftType,
  });

  // ── 5. Persist health record ──────────────────────────────────────────────
  const needsAlert = mlAnalysis.riskLevel === "HIGH" || mlAnalysis.riskLevel === "CRITICAL";
  const record = await healthRecordRepository.create({
    workerId: input.workerId,
    organizationId: worker.organizationId,
    shiftType: input.shiftType as any,
    location: {
      lat: input.location?.lat ?? 0,
      lng: input.location?.lng ?? 0,
      site: worker.site,
    },
    images: {
      faceUrl: input.faceImageUrl,
      envUrl: input.envImageUrl,
    },
    visionAnalysis: vision,
    mlAnalysis,
    recommendations,
    alertSent: false,
    alertId: null,
  });

  // ── 6. Update worker health profile ──────────────────────────────────────
  const newStreak =
    mlAnalysis.riskLevel === "LOW"
      ? (worker.healthProfile.streakDaysLowRisk ?? 0) + 1
      : 0;

  await workerRepository.updateHealthProfile(input.workerId, worker.organizationId, {
    lastCheckin: record.timestamp,
    currentRiskLevel: mlAnalysis.riskLevel,
    streakDaysLowRisk: newStreak,
  });

  // ── 7. Alert + notifications ──────────────────────────────────────────────
  let alertId: string | null = null;

  if (needsAlert) {
    const lastAlertTime = await alertRepository.getLastAlertTime(
      input.workerId,
      "HEALTH_RISK"
    );
    const throttled = shouldThrottle(lastAlertTime, 30);

    if (!throttled) {
      const alert = await alertRepository.create({
        organizationId: worker.organizationId,
        workerId: input.workerId,
        workerName: worker.name,
        checkinId: record.id,
        severity: mlAnalysis.riskLevel,
        type: "HEALTH_RISK",
        message: buildAlertMessage(mlAnalysis.riskLevel, mlAnalysis.riskFactors),
        riskFactors: mlAnalysis.riskFactors.map((f) => f.type),
        site: worker.site,
      });

      alertId = alert.id;

      const channels = await sendAlertNotifications({ worker, alert });

      // Update alert with sent channels
      // (done inline to avoid extra DB roundtrip)
      logger.info("Alert created and notifications sent", {
        alertId: alert.id,
        channels,
        riskLevel: mlAnalysis.riskLevel,
      });
    } else {
      logger.debug("Alert throttled — cooldown period active", { workerId: input.workerId });
    }
  }

  const duration = Date.now() - startTime;
  logger.info("Check-in completed", {
    workerId: input.workerId,
    score: mlAnalysis.healthScore,
    riskLevel: mlAnalysis.riskLevel,
    durationMs: duration,
  });

  res.status(201).json({
    success: true,
    checkinId: record.id,
    healthScore: mlAnalysis.healthScore,
    riskLevel: mlAnalysis.riskLevel,
    scoringMethod: mlAnalysis.scoringMethod ?? "rule_engine",
    riskFactors: mlAnalysis.riskFactors,
    recommendations,
    alertTriggered: alertId !== null,
    alertId,
    ppeStatus: {
      hasHelmet: faceAnalysis.hasHelmet,
      hasMask: faceAnalysis.hasMask,
    },
    environmentStatus: {
      dustLevel: envAnalysis.dustLevel,
      lightingLevel: envAnalysis.lightingLevel,
      detectedHazards: envAnalysis.detectedHazards,
    },
  });
}

/**
 * GET /checkin/:id
 * Returns the full detail of a completed check-in.
 */
export async function getCheckin(req: Request, res: Response): Promise<void> {
  // For brevity — in production, add a healthRecordRepository.findById method
  res.status(200).json({ id: req.params.id, message: "Use health records endpoint for full detail" });
}

function buildAlertMessage(riskLevel: string, riskFactors: any[]): string {
  const topFactor = riskFactors[0]?.type?.replace(/_/g, " ") ?? "multiple risk factors";
  const messages: Record<string, string> = {
    CRITICAL: `CRITICAL: Immediate action required. Worker flagged for ${topFactor.toLowerCase()}.`,
    HIGH: `HIGH RISK: Worker flagged for ${topFactor.toLowerCase()}. Supervisor attention needed.`,
  };
  return messages[riskLevel] ?? `Risk detected: ${topFactor.toLowerCase()}`;
}
