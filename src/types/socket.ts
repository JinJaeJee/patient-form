import type { PatientFormValues } from "@/schema/patient";

export type SessionStatus =
  | "filling"
  | "inactive"
  | "submitted"
  | "disconnected";

export type PatientField = keyof PatientFormValues;

export type PatientValues = Partial<Record<PatientField, string>>;

export type ValidationErrors = Partial<Record<PatientField, string>>;

export interface PatientSession {
  sessionId: string;
  values: PatientValues;
  errors: ValidationErrors;
  status: SessionStatus;
  activeField: PatientField | null;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
}

export const SOCKET_EVENTS = {
  SESSION_JOIN: "session:join",
  FIELD_UPDATE: "field:update",
  FIELD_FOCUS: "field:focus",
  SESSION_SUBMIT: "session:submit",
  STAFF_JOIN: "staff:join",
  SESSION_SNAPSHOT: "session:snapshot",
  SESSION_UPDATE: "session:update",
  SESSION_STATUS: "session:status",
  SESSION_FOCUS: "session:focus",
  SESSION_VALIDITY: "session:validity",
  SESSION_REMOVED: "session:removed",
} as const;

export interface SessionJoinPayload {
  sessionId: string;
  snapshot: PatientValues;
}

export interface FieldUpdatePayload {
  sessionId: string;
  field: PatientField;
  value: string;
}

export interface FieldFocusPayload {
  sessionId: string;
  field: PatientField | null;
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

export interface SessionFocusPayload {
  sessionId: string;
  field: PatientField | null;
}

export interface SessionValidityPayload {
  sessionId: string;
  errors: ValidationErrors;
}

export interface SessionRemovedPayload {
  sessionId: string;
}

export interface ClientToServerEvents {
  "session:join": (payload: SessionJoinPayload) => void;
  "field:update": (payload: FieldUpdatePayload) => void;
  "field:focus": (payload: FieldFocusPayload) => void;
  "session:validity": (payload: SessionValidityPayload) => void;
  "session:submit": (payload: SessionSubmitPayload) => void;
  "staff:join": () => void;
}

export interface ServerToClientEvents {
  "session:snapshot": (sessions: PatientSession[]) => void;
  "session:update": (payload: SessionUpdatePayload) => void;
  "session:status": (payload: SessionStatusPayload) => void;
  "session:focus": (payload: SessionFocusPayload) => void;
  "session:validity": (payload: SessionValidityPayload) => void;
  "session:removed": (payload: SessionRemovedPayload) => void;
}
