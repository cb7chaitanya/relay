import type { ChatMessage } from "@/hooks/useChat";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="log"
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
        aria-label={`${isUser ? "You" : "Support agent"} said`}
      >
        {message.text}
      </div>
    </div>
  );
}
