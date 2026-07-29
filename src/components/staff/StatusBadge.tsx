import type { SessionStatus } from "@/types/socket";
import { Badge } from "@/components/ui/Badge";

// Single place where status presentation (colour + label) is defined. Status is
// communicated redundantly by colour AND text so it never relies on colour alone.
const STATUS_STYLE: Record<
  SessionStatus,
  { label: string; dot: string; badge: string }
> = {
  filling: {
    label: "Filling",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-800",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  submitted: {
    label: "Submitted",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-slate-400",
    badge: "bg-slate-200 text-slate-700",
  },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <Badge className={s.badge}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot} ${
          status === "filling" ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      {s.label}
    </Badge>
  );
}
