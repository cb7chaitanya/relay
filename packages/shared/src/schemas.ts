import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long"),
  sessionId: z.string().uuid("Invalid session ID").optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
