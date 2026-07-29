"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PatientField, PatientValues } from "@/types/socket";
import type { AppSocket } from "@/lib/socket-client";

const DEBOUNCE_MS = 300;

export function usePatientSession(params: {
  socket: AppSocket;
  sessionId: string;
  getSnapshot: () => PatientValues;
}) {
  const { socket, sessionId, getSnapshot } = params;

  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    socket.emit("session:join", { sessionId, snapshot: snapshotRef.current() });
    socket.emit("session:submit", { sessionId });
  }, [socket, sessionId]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return { emitField, submit };
}
