import { config } from "../config";
import { createLLMProvider } from "./factory";

export const llmProvider = createLLMProvider(config);
