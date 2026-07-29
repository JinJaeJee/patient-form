import type { FieldConfig, SectionConfig } from "@/schema/patient";
import { FormField } from "./FormField";

/**
 * A titled group of fields laid out in the responsive grid: single column on
 * mobile, two columns at md+. Purely presentational.
 */
export function FormSection({
  section,
  fields,
}: {
  section: SectionConfig;
  fields: readonly FieldConfig[];
}) {
  return (
    <section aria-labelledby={`section-${section.id}`} className="space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h2
          id={`section-${section.id}`}
          className="text-base font-semibold text-slate-900"
        >
          {section.title}
        </h2>
        {section.description && (
          <p className="text-xs text-slate-500">{section.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {fields.map((field) => (
          <FormField key={field.name} field={field} />
        ))}
      </div>
    </section>
  );
}
