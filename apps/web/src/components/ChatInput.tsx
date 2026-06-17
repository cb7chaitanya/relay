import { useEffect, useRef, useState } from "react";

const MAX_LENGTH = 4000;
const WARN_THRESHOLD = 3800;

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_LENGTH - value.length;
  const showCounter = value.length >= WARN_THRESHOLD;
  const overLimit = remaining < 0;

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled || overLimit) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-white px-4 py-3 safe-bottom"
      aria-label="Message input"
    >
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            maxLength={MAX_LENGTH}
            rows={1}
            aria-label="Message"
            aria-describedby={showCounter ? "char-counter" : undefined}
            className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm leading-normal focus:outline-none focus:ring-1 disabled:opacity-50 ${
              overLimit
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {showCounter && (
            <span
              id="char-counter"
              aria-live="polite"
              className={`absolute bottom-1 right-2 text-xs ${
                overLimit ? "text-red-500" : "text-gray-400"
              }`}
            >
              {remaining}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim() || overLimit}
          aria-label="Send message"
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </form>
  );
}
