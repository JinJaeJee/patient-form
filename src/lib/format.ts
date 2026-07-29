import { GENDER_OPTIONS, type FieldConfig } from "@/schema/patient";

export function displayValue(
  field: FieldConfig,
  value: string | undefined,
): string {
  if (!value) return "";
  if (field.name === "gender") {
    return GENDER_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

export function relativeTime(ts: number, now: number = Date.now()): string {
  const secs = Math.max(0, Math.round((now - ts) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export function patientDisplayName(values: {
  firstName?: string;
  lastName?: string;
}): string {
  const name = [values.firstName, values.lastName].filter(Boolean).join(" ").trim();
  return name || "Unnamed patient";
}
