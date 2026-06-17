"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageDTO } from "@relay/shared";
import {
  fetchSession,
  SessionNotFoundError,
  streamChatMessage,
} from "@/lib/api";
import { SESSION_KEY } from "@/lib/constants";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

function toLocalMessage(dto: MessageDTO): ChatMessage {
  return {
    id: dto.id,
    sender: dto.sender === "USER" ? "user" : "assistant",
    text: dto.text,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    setIsRestoring(true);
    fetchSession(stored)
      .then((session) => {
        sessionIdRef.current = session.sessionId;
        setMessages(session.messages.map(toLocalMessage));
      })
      .catch((err) => {
        if (err instanceof SessionNotFoundError) {
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .finally(() => setIsRestoring(false));
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || activeRequestRef.current) return;

    const controller = new AbortController();
    activeRequestRef.current = controller;
    lastFailedMessageRef.current = trimmed;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    const assistantId = crypto.randomUUID();
    let assistantCreated = false;

    streamChatMessage(
      trimmed,
      sessionIdRef.current,
      (sseEvent) => {
        switch (sseEvent.event) {
          case "session": {
            const data = JSON.parse(sseEvent.data) as { sessionId: string };
            sessionIdRef.current = data.sessionId;
            localStorage.setItem(SESSION_KEY, data.sessionId);
            break;
          }
          case "token": {
            const data = JSON.parse(sseEvent.data) as { token: string };
            if (!assistantCreated) {
              assistantCreated = true;
              setIsLoading(false);
              setIsStreaming(true);
              setMessages((prev) => [
                ...prev,
                { id: assistantId, sender: "assistant" as const, text: data.token },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, text: m.text + data.token }
                    : m,
                ),
              );
            }
            break;
          }
          case "done": {
            lastFailedMessageRef.current = null;
            break;
          }
          case "error": {
            const data = JSON.parse(sseEvent.data) as { error: string };
            setError(data.error);
            break;
          }
        }
      },
      controller.signal,
    )
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to send message",
        );
      })
      .finally(() => {
        activeRequestRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
      });
  }, []);

  const retry = useCallback(() => {
    const failed = lastFailedMessageRef.current;
    if (!failed) return;
    setMessages((prev) => {
      const lastUserIdx = prev.findLastIndex((m) => m.sender === "user");
      if (lastUserIdx === -1) return prev;
      return prev.slice(0, lastUserIdx);
    });
    setError(null);
    sendMessage(failed);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    isRestoring,
    error,
    sendMessage,
    retry,
    canRetry: !!lastFailedMessageRef.current && !isLoading && !isStreaming,
    clearError: useCallback(() => setError(null), []),
  };
}
