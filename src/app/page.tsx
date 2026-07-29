import type { Metadata } from "next";
import { PatientForm } from "@/components/patient/PatientForm";

export const metadata: Metadata = {
  title: "Patient Form",
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Patient Intake Form
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Please fill in your details. Fields marked{" "}
            <span className="text-red-500">*</span> are required.
          </p>
        </header>

        <PatientForm />
      </div>
    </main>
  );
}
