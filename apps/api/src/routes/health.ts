import { Router } from "express";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { logger } from "../lib/logger";

const router = Router();

router.get("/health", async (req, res) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    logger.error("Health check: database unreachable", {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const status = dbStatus === "connected" ? "ok" : "degraded";
  const code = status === "ok" ? 200 : 503;

  res.status(code).json({
    status,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    provider: config.LLM_PROVIDER,
  });
});

export default router;
