"use client";

import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import Sidebar from "./Sidebar";
import EmptyState from "./EmptyState";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import RestoringSkeleton from "./RestoringSkeleton";

export default function ChatWindow() {
  const {
    messages,
    sessions,
    activeSessionId,
    isLoading,
    isStreaming,
    isRestoring,
    isLoadingSessions,
    error,
    sendMessage,
    loadSession,
    startNewChat,
    retry,
    canRetry,
    clearError,
  } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showEmptyState = messages.length === 0 && !isLoading && !isRestoring;

  return (
    <div className="flex h-dvh bg-white">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-[280px] transform transition-transform duration-250 ease-out md:static md:z-auto md:w-[272px] md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onSelectSession={(id) => {
            loadSession(id);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            startNewChat();
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col" role="main">
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 py-3.5 backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Open sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600"
            aria-hidden="true"
          >
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-semibold text-gray-900">
              Relay Support
            </h1>
            <p className="text-[11px] text-gray-400">
              Typically replies instantly
            </p>
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
            className="flex shrink-0 items-center gap-2 border-t border-red-100 bg-red-50/80 px-4 py-2.5 text-[13px] text-red-600"
            role="alert"
          >
            <span className="flex-1">{error}</span>
            {canRetry && (
              <button
                onClick={retry}
                className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors duration-150 hover:bg-red-200"
              >
                Retry
              </button>
            )}
            <button
              onClick={clearError}
              aria-label="Dismiss error"
              className="shrink-0 rounded-md p-1 text-red-400 transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || isStreaming || isRestoring}
        />
      </div>
    </div>
  );
}
