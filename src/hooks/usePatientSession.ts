"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PatientField, PatientValues } from "@/types/socket";
import type { AppSocket } from "@/lib/socket-client";

const DEBOUNCE_MS = 300;

/**
 * Owns the patient -> server side of the realtime layer:
 *  - joins the session room on connect AND every reconnect, pushing a full
 *    snapshot so nothing entered during an outage is lost
 *  - emits field updates debounced per-field at 300ms
 *  - submits
 *
 * No component calls socket.emit directly; they call these functions.
 */
export function usePatientSession(params: {
  socket: AppSocket;
  sessionId: string;
  /** Returns the current full form values — used for join/reconnect snapshots. */
  getSnapshot: () => PatientValues;
}) {
  const { socket, sessionId, getSnapshot } = params;

  // Keep the latest snapshot getter in a ref so the join handler always reads
  // current values without re-subscribing.
  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Join on (re)connect. Re-emitting session:join with a fresh snapshot makes
  // reconnection idempotent — the server replaces its values wholesale.
  useEffect(() => {
    if (!sessionId) return;

    const join = () => {
      socket.emit("session:join", {
        sessionId,
        snapshot: snapshotRef.current(),
      });
    };

    if (socket.connected) join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
    };
  }, [socket, sessionId]);

  const emitField = useCallback(
    (field: PatientField, value: string) => {
      if (!sessionId) return;
      const existing = timers.current.get(field);
      if (existing) clearTimeout(existing);
      timers.current.set(
        field,
        setTimeout(() => {
          socket.emit("field:update", { sessionId, field, value });
          timers.current.delete(field);
        }, DEBOUNCE_MS),
      );
    },
    [socket, sessionId],
  );

  const submit = useCallback(() => {
    if (!sessionId) return;
    // Flush any pending debounced updates, then push a final authoritative
    // snapshot before marking submitted so no last keystroke is dropped.
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    socket.emit("session:join", { sessionId, snapshot: snapshotRef.current() });
    socket.emit("session:submit", { sessionId });
  }, [socket, sessionId]);

  // Clear timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return { emitField, submit };
}
