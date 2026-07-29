"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket, type AppSocket } from "@/lib/socket-client";

export type ConnectionState = "connected" | "reconnecting" | "offline";

/**
 * Owns connection lifecycle and nothing else. Domain hooks
 * (usePatientSession, useStaffSessions) build on top of this.
 */
export function useSocket(): { socket: AppSocket; status: ConnectionState } {
  const socketRef = useRef<AppSocket | null>(null);
  if (!socketRef.current) socketRef.current = getSocket();

  const [status, setStatus] = useState<ConnectionState>(() =>
    socketRef.current?.connected ? "connected" : "offline",
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("reconnecting");
    const onReconnectAttempt = () => setStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    if (socket.connected) setStatus("connected");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  return { socket: socketRef.current, status };
}
