import OpenAI from "openai";
import type { LLMMessage, TokenChunk, CompletionUsage } from "./types";
import { ServiceUnavailableError } from "../errors";
import { logger } from "../lib/logger";

const TIMEOUT_MS = 30_000;

export async function* streamFromClient(
  client: OpenAI,
  model: string,
  messages: LLMMessage[],
  signal?: AbortSignal,
): AsyncGenerator<TokenChunk> {
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: combinedSignal },
    );

    let fullText = "";
    let usage: CompletionUsage | null = null;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullText += content;
        yield { type: "token", token: content };
      }
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
        };
      }
    }

    yield { type: "done", text: fullText, usage };
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError");

    logger.error(isTimeout ? "LLM request timed out" : "LLM request failed", {
      model,
      error: err instanceof Error ? err.message : String(err),
    });

    throw new ServiceUnavailableError(
      isTimeout
        ? "AI response timed out. Please try again."
        : "I'm having trouble responding right now. Please try again shortly.",
    );
  }
}
