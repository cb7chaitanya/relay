export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionUsage {
  promptTokens: number;
  completionTokens: number;
}

export type TokenChunk =
  | { type: "token"; token: string }
  | { type: "done"; text: string; usage: CompletionUsage | null };

export interface LLMProvider {
  streamResponse(
    messages: LLMMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<TokenChunk>;
}
