import OpenAI from "openai";
import type { LLMProvider, LLMMessage, TokenChunk } from "./types";
import { streamFromClient } from "./openai-compat";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async *streamResponse(
    messages: LLMMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<TokenChunk> {
    yield* streamFromClient(this.client, this.model, messages, signal);
  }
}
