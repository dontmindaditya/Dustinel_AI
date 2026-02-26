import "express-async-errors";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { corsOptions } from "./config/cors.config";
import { apiRateLimit } from "./middleware/rateLimit.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

// Routes
import authRoutes from "./routes/auth.routes";
import checkinRoutes from "./routes/checkin.routes";
import workerRoutes from "./routes/worker.routes";
import adminRoutes from "./routes/admin.routes";
import healthRoutes from "./routes/health.routes";

export function createApp(): Application {
  const app = express();

  // ─── Security & transport middleware ────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "*.azure.com", "*.blob.core.windows.net"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));
  app.use(cors(corsOptions));
  app.set("trust proxy", 1); // for rate limiter behind Azure App Service

  // ─── Request parsing ────────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(compression());

  // ─── Logging ────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan("combined", {
        stream: { write: (msg) => logger.http(msg.trim()) },
        skip: (req) => req.path === "/ping",
      })
    );
  }

  // ─── Health probe ──────────────────────────────────────────────────────────
  app.get("/ping", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ─── API routes ─────────────────────────────────────────────────────────────
  app.use("/api/v1", apiRateLimit);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/checkin", checkinRoutes);
  app.use("/api/v1/workers", workerRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/health", healthRoutes);

  // ─── Error handling ──────────────────────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}