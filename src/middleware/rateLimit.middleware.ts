import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/asyncHandler";

// General API rate limiter — 100 req/min per IP
export const apiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req, _res) => ({
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  }),
  skip: (req) => env.NODE_ENV === "development" && !req.headers["x-enforce-rate-limit"],
});

// Strict check-in limiter — 10 per hour per user
export const checkinRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.CHECKIN_RATE_LIMIT_MAX,
  keyGenerator: (req) => req.user?.sub || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "CHECKIN_RATE_LIMIT_EXCEEDED",
    message: "Maximum check-ins per hour reached. Please wait before checking in again.",
  },
});

// Auth endpoint limiter — prevent brute force
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    message: "Too many login attempts. Please wait 15 minutes.",
  },
});