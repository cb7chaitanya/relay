import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";

const server = app.listen(config.PORT, () => {
  logger.info("Server started", {
    port: config.PORT,
    provider: config.LLM_PROVIDER,
    env: config.NODE_ENV,
  });
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info("Graceful shutdown initiated", { signal });

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
