import type { ConnectionState } from "@/hooks/useSocket";

const STYLE: Record<ConnectionState, { label: string; dot: string; text: string }> =
  {
    connected: { label: "Live", dot: "bg-green-500", text: "text-green-700" },
    reconnecting: {
      label: "Reconnecting…",
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-700",
    },
    offline: { label: "Offline", dot: "bg-slate-400", text: "text-slate-500" },
  };

/**
 * Persistent connection status. It matters on both sides: a disconnected patient
 * is invisible to staff, and a frozen dashboard looks identical to an empty clinic.
 */
export function ConnectionIndicator({ status }: { status: ConnectionState }) {
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}
      role="status"
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
