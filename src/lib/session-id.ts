import { v4 as uuidv4 } from "uuid";

// A patient's sessionId is generated once and persisted in sessionStorage so a
// page refresh resumes the SAME session (rather than spawning a duplicate row on
// the staff dashboard). sessionStorage — not localStorage — because the session
// is scoped to the tab: closing it ends the intake.
const STORAGE_KEY = "patient:sessionId";

export function getOrCreateSessionId(): string {
  // Guard for SSR — there is no sessionStorage on the server.
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = uuidv4();
  window.sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}
