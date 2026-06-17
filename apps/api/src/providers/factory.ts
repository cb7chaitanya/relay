import type { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";

interface ProviderConfig {
  LLM_PROVIDER: "openai" | "openrouter";
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

export function createLLMProvider(cfg: ProviderConfig): LLMProvider {
  switch (cfg.LLM_PROVIDER) {
    case "openai": {
      if (!cfg.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
        );
      }
      return new OpenAIProvider(cfg.OPENAI_API_KEY);
    }
    case "openrouter": {
      if (!cfg.OPENROUTER_API_KEY) {
        throw new Error(
          "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter",
        );
      }
      return new OpenRouterProvider(cfg.OPENROUTER_API_KEY);
    }
  }
}
