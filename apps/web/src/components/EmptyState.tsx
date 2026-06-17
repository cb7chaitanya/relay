import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export default function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
          aria-hidden="true"
        >
          <span className="text-xl">💬</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          How can we help you?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ask us anything about orders, shipping, returns, or support.
        </p>
        <nav className="mt-6 grid gap-2" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              {q}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
