import type { SessionResponse, SessionSummary } from "@relay/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface SSEEvent {
  event: string;
  data: string;
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}

export async function streamChatMessage(
  message: string,
  sessionId: string | null,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const body: Record<string, string> = { message };
  if (sessionId) body["sessionId"] = sessionId;

  const response = await fetch(`${API_URL}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        let event = "";
        let data = "";

        for (const line of trimmed.split("\n")) {
          if (line.startsWith(":")) continue;
          if (line.startsWith("event: ")) event = line.slice(7);
          else if (line.startsWith("data: ")) data = line.slice(6);
        }

        if (event && data) {
          onEvent({ event, data });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const response = await fetch(`${API_URL}/chat/sessions`);
  if (!response.ok) {
    throw new Error("Failed to load sessions");
  }
  return response.json();
}

export async function fetchSession(
  sessionId: string,
): Promise<SessionResponse> {
  const response = await fetch(`${API_URL}/chat/session/${sessionId}`);

  if (response.status === 404) {
    throw new SessionNotFoundError();
  }

  if (!response.ok) {
    throw new Error("Failed to load conversation");
  }

  return response.json();
}
