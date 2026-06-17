import { Router } from "express";
import { chatRequestSchema, sessionIdParamSchema } from "@relay/shared";
import type { ChatRequest } from "@relay/shared";
import { validateBody, validateParams } from "../middleware/validate";
import { chatRateLimit } from "../middleware/rate-limit";
import {
  handleChatMessage,
  getSession,
  deleteSession,
} from "../services/chat.service";
import { AppError } from "../errors";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/chat/message",
  chatRateLimit,
  validateBody(chatRequestSchema),
  async (req, res, next) => {
    const { message, sessionId } = req.body as ChatRequest;
    const { requestId } = req;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let clientDisconnected = false;
    req.on("close", () => {
      clientDisconnected = true;
    });

    try {
      for await (const event of handleChatMessage(
        message,
        sessionId,
        requestId,
      )) {
        if (clientDisconnected) {
          logger.warn("Client disconnected mid-stream", { requestId });
          break;
        }
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
      res.end();
    } catch (err) {
      if (res.headersSent) {
        const errorMessage =
          err instanceof AppError
            ? err.message
            : "An unexpected error occurred";
        const errorCode =
          err instanceof AppError ? err.code : "STREAM_ERROR";

        logger.error("Stream error after headers sent", {
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });

        if (!clientDisconnected) {
          res.write(
            `event: error\ndata: ${JSON.stringify({ error: errorMessage, code: errorCode })}\n\n`,
          );
        }
        res.end();
      } else {
        next(err);
      }
    }
  },
);

router.get(
  "/chat/session/:sessionId",
  validateParams(sessionIdParamSchema),
  async (req, res, next) => {
    try {
      const session = await getSession(req.params["sessionId"]!);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/chat/session/:sessionId",
  validateParams(sessionIdParamSchema),
  async (req, res, next) => {
    try {
      await deleteSession(req.params["sessionId"]!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
