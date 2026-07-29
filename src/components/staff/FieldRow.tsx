"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldConfig } from "@/schema/patient";
import { displayValue } from "@/lib/format";

export function FieldRow({
  field,
  value,
  active = false,
  error,
}: {
  field: FieldConfig;
  value: string | undefined;
  active?: boolean;
  error?: string;
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

  const containerClass = error
    ? "bg-red-50 ring-2 ring-red-300"
    : active
      ? "bg-blue-50 ring-2 ring-blue-400"
      : flash
        ? "animate-field-flash motion-reduce:animate-none motion-reduce:ring-2 motion-reduce:ring-blue-400"
        : "";

  return (
    <div className={`rounded-md px-3 py-2 transition-colors ${containerClass}`}>
      <dt className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>{field.label}</span>
        {active && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold normal-case text-blue-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            editing…
          </span>
        )}
      </dt>
      <dd
        className={`mt-0.5 break-words text-sm ${
          error ? "text-red-700" : "text-slate-900"
        }`}
      >
        {display ? (
          display
        ) : (
          <span className="italic text-slate-400">—</span>
        )}
      </dd>
      {error && (
        <p className="mt-1 flex items-start gap-1 text-xs font-medium text-red-600">
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
