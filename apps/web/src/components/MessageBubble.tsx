import type { ChatMessage } from "@/hooks/useChat";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] whitespace-pre-wrap break-words px-4 py-3 text-[14px] leading-[1.65] ${
          isUser
            ? "rounded-[20px] rounded-br-md bg-blue-600 text-white"
            : "rounded-[20px] rounded-bl-md bg-gray-100/80 text-gray-800"
        }`}
        aria-label={`${isUser ? "You" : "Support agent"} said`}
      >
        {message.text}
      </div>
    </div>
  );
}
