import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors";
import { logger } from "../lib/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn(err.message, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
    });
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error("Unhandled error", {
    requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res
    .status(500)
    .json({ error: "Internal server error", code: "INTERNAL_ERROR" });
};
