/** Post-submit confirmation state, replacing the form. */
export function SubmitSuccess({ firstName }: { firstName?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-slate-900">
        Thank you{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-sm text-slate-600">
        Your intake form has been submitted. A staff member will be with you
        shortly.
      </p>
    </div>
  );
}
