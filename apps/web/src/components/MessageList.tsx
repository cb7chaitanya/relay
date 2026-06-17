import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({
  messages,
  isLoading,
  isStreaming,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isLoading, isStreaming]);

  return (
    <div
      className="message-scroll h-full overflow-y-auto px-4 py-8 sm:px-6"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <div className="mx-auto max-w-[720px] space-y-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  );
}
