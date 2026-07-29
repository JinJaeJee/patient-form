import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "patient:sessionId";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = uuidv4();
  window.sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}
