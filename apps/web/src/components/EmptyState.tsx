import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export default function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-lg text-center">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50"
          aria-hidden="true"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-blue-500"
          >
            <path
              d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5-1.338A9.96 9.96 0 0012 22z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          How can we help you?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
          Ask us anything about your orders, shipping, returns, or general
          support.
        </p>
        <nav
          className="mt-8 grid gap-2.5 sm:grid-cols-2"
          aria-label="Suggested questions"
        >
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 text-left text-[13px] leading-snug text-gray-600 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow active:scale-[0.98]"
            >
              {q}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
