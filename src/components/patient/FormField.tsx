"use client";

import { useFormContext } from "react-hook-form";
import type { FieldConfig, PatientFormValues } from "@/schema/patient";

const controlBase =
  "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition " +
  "min-h-[44px] placeholder:text-slate-400 " +
  "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50";

function controlClasses(hasError: boolean): string {
  return `${controlBase} ${
    hasError ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-slate-300"
  }`;
}

export function FormField({ field }: { field: FieldConfig }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PatientFormValues>();

  const error = errors[field.name];
  const hasError = !!error;
  const errorId = `${field.name}-error`;
  const describedBy = hasError ? errorId : undefined;

  const registration = register(field.name);

  return (
    <div className={field.fullWidth ? "md:col-span-2" : undefined}>
      <label
        htmlFor={field.name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {field.type === "select" ? (
        <select
          id={field.name}
          className={controlClasses(hasError)}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          defaultValue=""
          {...registration}
        >
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={field.name}
          rows={3}
          className={controlClasses(hasError)}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          {...registration}
        />
      ) : (
        <input
          id={field.name}
          type={field.type}
          className={controlClasses(hasError)}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          {...registration}
        />
      )}

      {hasError && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error?.message}
        </p>
      )}
    </div>
  );
}
