import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { corsOptions } from "./config/cors.config";

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = http.createServer(app);

  // ─── Socket.IO for real-time alerts ──────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions as any,
    path: "/socket.io",
  });

  io.use((socket: Socket, next) => {
    // Validate token on socket connection
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    // In production: validate JWT here and attach user to socket.data
    socket.data.orgId = socket.handshake.auth.orgId;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const orgId = socket.data.orgId;
    socket.join(`org:${orgId}`);
    logger.debug("Socket connected", { socketId: socket.id, orgId });

    socket.on("disconnect", () => {
      logger.debug("Socket disconnected", { socketId: socket.id });
    });
  });

  // Export io so controllers can emit events
  app.set("io", io);

  // ─── Start server ─────────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Dustinel API running`, {
      port: env.PORT,
      env: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });
  });

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});