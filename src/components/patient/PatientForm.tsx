"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PATIENT_FIELDS,
  PATIENT_SECTIONS,
  patientSchema,
  type PatientFormValues,
} from "@/schema/patient";
import { getOrCreateSessionId } from "@/lib/session-id";
import { useSocket } from "@/hooks/useSocket";
import { usePatientSession } from "@/hooks/usePatientSession";
import type { PatientField, PatientValues } from "@/types/socket";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { FormSection } from "./FormSection";
import { SubmitSuccess } from "./SubmitSuccess";

const defaultValues = PATIENT_FIELDS.reduce((acc, f) => {
  acc[f.name] = "";
  return acc;
}, {} as Record<keyof PatientFormValues, string>) as PatientFormValues;

export function PatientForm() {
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const { socket, status } = useSocket();

  const methods = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    getValues,
    formState: { isValid, isSubmitting },
  } = methods;

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const getSnapshot = (): PatientValues => getValues() as PatientValues;

  const { emitField, submit } = usePatientSession({
    socket,
    sessionId,
    getSnapshot,
  });

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (!name) return;
      emitField(name as PatientField, (values[name] ?? "") as string);
    });
    return () => subscription.unsubscribe();
  }, [watch, emitField]);

  const sectionsWithFields = useMemo(
    () =>
      PATIENT_SECTIONS.map((section) => ({
        section,
        fields: PATIENT_FIELDS.filter((f) => f.section === section.id),
      })),
    [],
  );

  const onSubmit = (values: PatientFormValues) => {
    submit();
    setSubmitted(true);
    return values;
  };

  if (submitted) {
    return <SubmitSuccess firstName={methods.getValues("firstName")} />;
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-8 pb-24 md:pb-0"
      >
        <div className="flex justify-end">
          <ConnectionIndicator status={status} />
        </div>

        {sectionsWithFields.map(({ section, fields }) => (
          <FormSection key={section.id} section={section} fields={fields} />
        ))}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/90 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            >
              {isSubmitting ? "Submitting…" : "Submit intake form"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
