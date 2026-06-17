import { z } from "zod";

const optionalKey = z
  .string()
  .optional()
  .transform((val) => (val && val.length > 0 ? val : undefined));

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
  LLM_PROVIDER: z.enum(["openai", "openrouter"]).default("openrouter"),
  OPENAI_API_KEY: optionalKey,
  OPENROUTER_API_KEY: optionalKey,
});

export const config = envSchema.parse(process.env);
