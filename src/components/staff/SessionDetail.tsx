import {
  PATIENT_FIELDS,
  PATIENT_SECTIONS,
} from "@/schema/patient";
import type { PatientSession } from "@/types/socket";
import { patientDisplayName, relativeTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { FieldRow } from "./FieldRow";

/**
 * Full record for the selected session, rendered from the SAME schema array the
 * patient form uses — so the two can never drift apart.
 */
export function SessionDetail({
  session,
  now,
}: {
  session: PatientSession;
  now: number;
}) {
  const name = patientDisplayName(session.values);

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          <p className="text-xs text-slate-500">
            Last activity {relativeTime(session.lastActivityAt, now)}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </header>

      <div className="space-y-6">
        {PATIENT_SECTIONS.map((section) => {
          const fields = PATIENT_FIELDS.filter((f) => f.section === section.id);
          return (
            <section key={section.id}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                {section.title}
              </h3>
              <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((field) => (
                  <FieldRow
                    key={field.name}
                    field={field}
                    value={session.values[field.name]}
                  />
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}
