import type { PatientFormValues } from "@/schema/patient";

// ---------------------------------------------------------------------------
// Shared realtime contract.
//
// Every socket event name and payload shape is declared here once and imported
// by both the client hooks and (by hand, as CommonJS) the server. Changing an
// event is a single-file change that the TypeScript client will type-check
// against immediately.
// ---------------------------------------------------------------------------

export type SessionStatus =
  | "filling"
  | "inactive"
  | "submitted"
  | "disconnected";

/** A form field key. */
export type PatientField = keyof PatientFormValues;

/** Form values as carried over the wire — always strings from inputs. */
export type PatientValues = Partial<Record<PatientField, string>>;

/** Server-side view of one patient session, as sent to staff. */
export interface PatientSession {
  sessionId: string;
  values: PatientValues;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
}

// --- Event name constants (string-safe reference for both sides) ------------

export const SOCKET_EVENTS = {
  // patient -> server
  SESSION_JOIN: "session:join",
  FIELD_UPDATE: "field:update",
  SESSION_SUBMIT: "session:submit",
  // staff -> server
  STAFF_JOIN: "staff:join",
  // server -> staff
  SESSION_SNAPSHOT: "session:snapshot",
  SESSION_UPDATE: "session:update",
  SESSION_STATUS: "session:status",
  SESSION_REMOVED: "session:removed",
} as const;

// --- Payloads ---------------------------------------------------------------

export interface SessionJoinPayload {
  sessionId: string;
  /** Full snapshot of current form values, so reconnects are idempotent. */
  snapshot: PatientValues;
}

export interface FieldUpdatePayload {
  sessionId: string;
  field: PatientField;
  value: string;
}

export interface SessionSubmitPayload {
  sessionId: string;
}

export interface SessionUpdatePayload {
  sessionId: string;
  field: PatientField;
  value: string;
  updatedAt: number;
}

export interface SessionStatusPayload {
  sessionId: string;
  status: SessionStatus;
}

export interface SessionRemovedPayload {
  sessionId: string;
}

// --- Typed socket.io interfaces (used by the client) ------------------------

export interface ClientToServerEvents {
  "session:join": (payload: SessionJoinPayload) => void;
  "field:update": (payload: FieldUpdatePayload) => void;
  "session:submit": (payload: SessionSubmitPayload) => void;
  "staff:join": () => void;
}

export interface ServerToClientEvents {
  "session:snapshot": (sessions: PatientSession[]) => void;
  "session:update": (payload: SessionUpdatePayload) => void;
  "session:status": (payload: SessionStatusPayload) => void;
  "session:removed": (payload: SessionRemovedPayload) => void;
}
