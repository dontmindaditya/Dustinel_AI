import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/asyncHandler";
import { logger } from "../utils/logger";
import { env } from "../config/env";

interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  stack?: string;
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors (expected, user-facing)
  if (err instanceof ValidationError) {
    res.status(400).json({
      code: err.code,
      message: err.message,
      details: err.details,
    } satisfies ErrorResponse);
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("Operational error", {
        message: err.message,
        code: err.code,
        path: req.path,
        method: req.method,
      });
    }

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    } satisfies ErrorResponse);
    return;
  }

  // JWT errors from jsonwebtoken
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    res.status(401).json({
      code: "INVALID_TOKEN",
      message: "Invalid or expired authentication token",
    });
    return;
  }

  // Multer errors
  if (err.name === "MulterError") {
    const multerErr = err as any;
    res.status(400).json({
      code: "FILE_UPLOAD_ERROR",
      message: multerErr.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 5MB."
        : multerErr.message,
    });
    return;
  }

  // Unhandled / unexpected errors
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.sub,
  });

  res.status(500).json({
    code: "INTERNAL_ERROR",
    message:
      env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again."
        : err.message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// 404 handler — must be registered AFTER all routes
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
  });
}