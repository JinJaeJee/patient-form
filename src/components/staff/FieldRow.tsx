"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldConfig } from "@/schema/patient";
import { displayValue } from "@/lib/format";

/**
 * One label/value pair in the staff detail panel. Owns the change-highlight
 * effect: when the value changes it flashes briefly so staff notice the update.
 * The first render (and remounts when switching sessions) never flashes.
 *
 * Under prefers-reduced-motion the flash animation is suppressed and a ring is
 * shown instead.
 */
export function FieldRow({
  field,
  value,
}: {
  field: FieldConfig;
  value: string | undefined;
}) {
  const [flash, setFlash] = useState(false);
  const isFirst = useRef(true);
  const prev = useRef(value);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prev.current = value;
      return;
    }
    if (value !== prev.current) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = displayValue(field, value);

  return (
    <div
      className={`rounded-md px-3 py-2 transition-colors ${
        flash
          ? "animate-field-flash motion-reduce:animate-none motion-reduce:ring-2 motion-reduce:ring-blue-400"
          : ""
      }`}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {field.label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">
        {display ? (
          display
        ) : (
          <span className="italic text-slate-400">—</span>
        )}
      </dd>
    </div>
  );
}
