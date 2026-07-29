"use client";

import { useEffect, useState } from "react";
import { useStaffSessions } from "@/hooks/useStaffSessions";
import { useNow } from "@/hooks/useNow";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { SessionList } from "./SessionList";
import { SessionDetail } from "./SessionDetail";

/**
 * Route-level container. Holds selected-session state and switches between the
 * stacked (mobile) and split-pane (lg+) layouts.
 */
export function StaffDashboard() {
  const { sessions, status } = useStaffSessions();
  const now = useNow(5_000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep selection valid as sessions come and go; default to the first one on
  // large screens where the detail pane is always visible.
  useEffect(() => {
    if (selectedId && !sessions.some((s) => s.sessionId === selectedId)) {
      setSelectedId(null);
    }
  }, [sessions, selectedId]);

  const selected = sessions.find((s) => s.sessionId === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Staff Monitor
          </h1>
          <p className="text-sm text-slate-500">
            {sessions.length} active session{sessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <ConnectionIndicator status={status} />
      </header>

      <div className="lg:flex lg:gap-6">
        {/* Master list. On mobile it hides once a session is selected. */}
        <aside
          className={`lg:w-80 lg:shrink-0 ${
            selected ? "hidden lg:block" : "block"
          }`}
        >
          <SessionList
            sessions={sessions}
            selectedId={selectedId}
            now={now}
            onSelect={setSelectedId}
          />
        </aside>

        {/* Detail pane. On mobile it replaces the list when a session is chosen. */}
        <section
          className={`min-w-0 flex-1 ${selected ? "block" : "hidden lg:block"}`}
        >
          {selected ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 lg:hidden"
              >
                <span aria-hidden="true">←</span> Back to list
              </button>
              <SessionDetail session={selected} now={now} />
            </div>
          ) : (
            <div className="hidden h-full items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 lg:flex">
              Select a session to view live details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
