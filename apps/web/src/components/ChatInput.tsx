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

  const hasContent = value.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-100 bg-white px-4 py-4 safe-bottom sm:px-6"
      aria-label="Message input"
    >
      <div className="mx-auto flex max-w-[720px] items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            maxLength={MAX_LENGTH}
            rows={1}
            aria-label="Message"
            aria-describedby={showCounter ? "char-counter" : undefined}
            className={`w-full resize-none rounded-2xl border bg-gray-50/50 px-4 py-3 text-[14px] leading-normal shadow-sm transition-all duration-150 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              overLimit
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"
            }`}
          />
          {showCounter && (
            <span
              id="char-counter"
              aria-live="polite"
              className={`absolute bottom-2 right-3 text-[11px] ${
                overLimit ? "text-red-500" : "text-gray-400"
              }`}
            >
              {remaining}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !hasContent || overLimit}
          aria-label="Send message"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 ${
            hasContent && !disabled && !overLimit
              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95"
              : "bg-gray-100 text-gray-300"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 9h11M9.5 4l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
