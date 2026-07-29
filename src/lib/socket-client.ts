import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";

// A single, typed socket connection shared across the app. Because client and
// server share an origin (the custom server.js), we connect with a bare io() —
// no URL, no env var, no CORS.
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io({
      // Socket.IO handles reconnection with exponential backoff by default.
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
    });
  }
  return socket;
}
