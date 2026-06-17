"use client";

import { useChat } from "@/hooks/useChat";
import EmptyState from "./EmptyState";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import RestoringSkeleton from "./RestoringSkeleton";

export default function ChatWindow() {
  const {
    messages,
    isLoading,
    isStreaming,
    isRestoring,
    error,
    sendMessage,
    retry,
    canRetry,
    clearError,
  } = useChat();

  const showEmptyState = messages.length === 0 && !isLoading && !isRestoring;

  return (
    <div className="flex h-dvh flex-col" role="main">
      <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 sm:px-6">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600"
          aria-hidden="true"
        >
          <span className="text-sm font-bold text-white">R</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            Relay Support
          </h1>
          <p className="text-xs text-gray-500">Typically replies instantly</p>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {isRestoring ? (
          <RestoringSkeleton />
        ) : showEmptyState ? (
          <EmptyState onSuggestionClick={sendMessage} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
          />
        )}
      </div>

      {error && (
        <div
          className="flex shrink-0 items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
          role="alert"
        >
          <span className="flex-1">{error}</span>
          {canRetry && (
            <button
              onClick={retry}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              Retry
            </button>
          )}
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            className="shrink-0 rounded px-2 py-0.5 text-red-500 hover:bg-red-100"
          >
            ✕
          </button>
        </div>
      )}

      <ChatInput
        onSend={sendMessage}
        disabled={isLoading || isStreaming || isRestoring}
      />
    </div>
  );
}
