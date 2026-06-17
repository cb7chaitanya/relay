export enum Sender {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  title: string | null;
  createdAt: string;
}

export interface SessionResponse {
  sessionId: string;
  messages: MessageDTO[];
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
}

export interface ChatStreamSessionData {
  sessionId: string;
}

export interface ChatStreamTokenData {
  token: string;
}

export interface ChatStreamDoneData {
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface ChatStreamErrorData {
  error: string;
  code: string;
}
