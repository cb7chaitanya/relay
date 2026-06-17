"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageDTO, SessionSummary } from "@relay/shared";
import {
  fetchSession,
  fetchSessions,
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
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  const refreshSessions = useCallback(() => {
    fetchSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setIsLoadingSessions(false));
  }, []);

  useEffect(() => {
    refreshSessions();
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      setIsRestoring(false);
      return;
    }

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
  }, [refreshSessions]);

  const loadSession = useCallback(
    (id: string) => {
      if (id === sessionIdRef.current) return;
      if (activeRequestRef.current) return;

      setIsRestoring(true);
      setMessages([]);
      setError(null);

      fetchSession(id)
        .then((session) => {
          sessionIdRef.current = session.sessionId;
          localStorage.setItem(SESSION_KEY, session.sessionId);
          setMessages(session.messages.map(toLocalMessage));
        })
        .catch((err) => {
          if (err instanceof SessionNotFoundError) {
            refreshSessions();
          }
          setError(
            err instanceof Error ? err.message : "Failed to load conversation",
          );
        })
        .finally(() => setIsRestoring(false));
    },
    [refreshSessions],
  );

  const startNewChat = useCallback(() => {
    if (activeRequestRef.current) return;
    sessionIdRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
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
              const data = JSON.parse(sseEvent.data) as {
                sessionId: string;
              };
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
                  {
                    id: assistantId,
                    sender: "assistant" as const,
                    text: data.token,
                  },
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
          refreshSessions();
        });
    },
    [refreshSessions],
  );

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
    sessions,
    activeSessionId: sessionIdRef.current,
    isLoading,
    isStreaming,
    isRestoring,
    isLoadingSessions,
    error,
    sendMessage,
    loadSession,
    startNewChat,
    retry,
    canRetry: !!lastFailedMessageRef.current && !isLoading && !isStreaming,
    clearError: useCallback(() => setError(null), []),
  };
}
