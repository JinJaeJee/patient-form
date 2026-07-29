import type { PatientSession } from "@/types/socket";
import { SessionListItem } from "./SessionListItem";

export function SessionList({
  sessions,
  selectedId,
  now,
  onSelect,
}: {
  sessions: PatientSession[];
  selectedId: string | null;
  now: number;
  onSelect: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No active sessions yet. Open the patient form in another tab to see it
        appear here live.
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-live="polite">
      {sessions.map((session) => (
        <li key={session.sessionId}>
          <SessionListItem
            session={session}
            selected={session.sessionId === selectedId}
            now={now}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
