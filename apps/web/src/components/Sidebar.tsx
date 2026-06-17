import type { SessionSummary } from "@relay/shared";
import { relativeTime, getTimeGroup, type TimeGroup } from "@/lib/time";

const GROUP_ORDER: TimeGroup[] = [
  "Today",
  "Yesterday",
  "Previous 7 Days",
  "Older",
];

function groupSessions(sessions: SessionSummary[]) {
  const groups = new Map<TimeGroup, SessionSummary[]>();
  for (const s of sessions) {
    const group = getTimeGroup(s.updatedAt);
    const list = groups.get(group) ?? [];
    list.push(s);
    groups.set(group, list);
  }
  return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
    label: g,
    items: groups.get(g)!,
  }));
}

export default function Sidebar({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewChat,
}: {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}) {
  const grouped = groupSessions(sessions);

  return (
    <nav
      className="flex h-full flex-col border-r border-gray-800/50 bg-gray-900 text-gray-300"
      aria-label="Conversation history"
    >
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-lg border border-gray-700/60 px-3.5 py-2.5 text-[13px] font-medium text-gray-200 transition-all duration-150 hover:border-gray-600 hover:bg-gray-800/70"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          New Chat
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <SidebarSkeleton />
        ) : sessions.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-[13px] text-gray-500">No conversations yet</p>
            <p className="mt-1 text-xs text-gray-600">Start a new chat</p>
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label} className="mb-1">
              <h3 className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </h3>
              <div className="space-y-0.5">
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    title={s.title ?? "Untitled conversation"}
                    className={`group flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150 ${
                      s.id === activeSessionId
                        ? "bg-gray-800 text-white shadow-sm"
                        : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                    }`}
                  >
                    <span className="flex-1 truncate leading-snug">
                      {s.title ?? "Untitled conversation"}
                    </span>
                    <span
                      className={`ml-2 shrink-0 text-[10px] transition-colors duration-150 ${
                        s.id === activeSessionId
                          ? "text-gray-500"
                          : "text-gray-600 group-hover:text-gray-500"
                      }`}
                    >
                      {relativeTime(s.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </nav>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-2 py-4" aria-busy="true">
      {[72, 88, 64, 80, 56].map((w, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-lg bg-gray-800/60"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}
