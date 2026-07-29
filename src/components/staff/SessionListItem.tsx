import { PATIENT_FIELDS } from "@/schema/patient";
import type { PatientSession } from "@/types/socket";
import { patientDisplayName, relativeTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

const REQUIRED_FIELDS = PATIENT_FIELDS.filter((f) => f.required);

function completion(session: PatientSession): number {
  const filled = REQUIRED_FIELDS.filter(
    (f) => (session.values[f.name] ?? "").trim().length > 0,
  ).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function SessionListItem({
  session,
  selected,
  now,
  onSelect,
}: {
  session: PatientSession;
  selected: boolean;
  now: number;
  onSelect: (id: string) => void;
}) {
  const pct = completion(session);
  const name = patientDisplayName(session.values);
  const errorCount = Object.keys(session.errors).length;

  return (
    <button
      type="button"
      onClick={() => onSelect(session.sessionId)}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-lg border p-3 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-medium text-slate-900">{name}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              ⚠ {errorCount}
            </span>
          )}
          <StatusBadge status={session.status} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 text-right text-xs tabular-nums text-slate-500">
          {pct}%
        </span>
      </div>

      <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
        <span>{relativeTime(session.lastActivityAt, now)}</span>
        {session.activeField && (
          <span className="inline-flex items-center gap-1 font-medium text-blue-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            typing…
          </span>
        )}
      </p>
    </button>
  );
}
