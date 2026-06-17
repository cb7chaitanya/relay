import OpenAI from "openai";
import type { LLMProvider, LLMMessage, TokenChunk } from "./types";
import { streamFromClient } from "./openai-compat";

const BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new OpenAI({ apiKey, baseURL: BASE_URL });
    this.model = model;
  }

  async *streamResponse(
    messages: LLMMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<TokenChunk> {
    yield* streamFromClient(this.client, this.model, messages, signal);
  }
}
