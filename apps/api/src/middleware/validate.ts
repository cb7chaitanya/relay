import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../errors";

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ValidationError(
          result.error.errors[0]?.message ?? "Invalid request",
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        new ValidationError(
          result.error.errors[0]?.message ?? "Invalid parameters",
        ),
      );
      return;
    }
    next();
  };
}
