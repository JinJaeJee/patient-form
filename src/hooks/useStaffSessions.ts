"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket, type ConnectionState } from "./useSocket";
import type {
  PatientSession,
  SessionUpdatePayload,
  SessionStatusPayload,
  SessionFocusPayload,
  SessionValidityPayload,
  SessionRemovedPayload,
} from "@/types/socket";

export function useStaffSessions(): {
  sessions: PatientSession[];
  status: ConnectionState;
} {
  const { socket, status } = useSocket();
  const [map, setMap] = useState<Record<string, PatientSession>>({});

  useEffect(() => {
    const join = () => socket.emit("staff:join");

    const onSnapshot = (list: PatientSession[]) => {
      const next: Record<string, PatientSession> = {};
      for (const s of list) next[s.sessionId] = s;
      setMap(next);
    };

    const onUpdate = ({
      sessionId,
      field,
      value,
      updatedAt,
    }: SessionUpdatePayload) => {
      setMap((prev) => {
        const current = prev[sessionId] ?? blankSession(sessionId);
        return {
          ...prev,
          [sessionId]: {
            ...current,
            values: { ...current.values, [field]: value },
            updatedAt,
            lastActivityAt: updatedAt,
          },
        };
      });
    };

    const onStatus = ({
      sessionId,
      status: nextStatus,
    }: SessionStatusPayload) => {
      setMap((prev) => {
        const current = prev[sessionId] ?? blankSession(sessionId);
        return {
          ...prev,
          [sessionId]: { ...current, status: nextStatus },
        };
      });
    };

    const onFocus = ({ sessionId, field }: SessionFocusPayload) => {
      setMap((prev) => {
        const current = prev[sessionId];
        if (!current) return prev;
        return {
          ...prev,
          [sessionId]: { ...current, activeField: field },
        };
      });
    };

    const onValidity = ({ sessionId, errors }: SessionValidityPayload) => {
      setMap((prev) => {
        const current = prev[sessionId];
        if (!current) return prev;
        return {
          ...prev,
          [sessionId]: { ...current, errors },
        };
      });
    };

    const onRemoved = ({ sessionId }: SessionRemovedPayload) => {
      setMap((prev) => {
        if (!prev[sessionId]) return prev;
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    };

    socket.on("connect", join);
    socket.on("session:snapshot", onSnapshot);
    socket.on("session:update", onUpdate);
    socket.on("session:status", onStatus);
    socket.on("session:focus", onFocus);
    socket.on("session:validity", onValidity);
    socket.on("session:removed", onRemoved);

    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      socket.off("session:snapshot", onSnapshot);
      socket.off("session:update", onUpdate);
      socket.off("session:status", onStatus);
      socket.off("session:focus", onFocus);
      socket.off("session:validity", onValidity);
      socket.off("session:removed", onRemoved);
    };
  }, [socket]);

  const sessions = useMemo(
    () => Object.values(map).sort((a, b) => b.lastActivityAt - a.lastActivityAt),
    [map],
  );

  return { sessions, status };
}

function blankSession(sessionId: string): PatientSession {
  const ts = Date.now();
  return {
    sessionId,
    values: {},
    errors: {},
    status: "filling",
    activeField: null,
    createdAt: ts,
    updatedAt: ts,
    lastActivityAt: ts,
  };
}
