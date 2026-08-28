type ServiceErrorPopupProps = {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string | Record<string, unknown> | unknown;
  onClose: () => void;
};

function formatPopupDetails(details?: string | Record<string, unknown> | unknown): string | null {
  if (details === undefined || details === null) {
    return null;
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export function ServiceErrorPopup({
  isOpen,
  title,
  message,
  details,
  onClose,
}: ServiceErrorPopupProps) {
  if (!isOpen) return null;

  const formattedDetails = formatPopupDetails(details);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-error-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl sm:p-6">
        <h2
          id="service-error-title"
          className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-rose-700"
        >
          {title}
        </h2>

        <p className="mt-3 text-sm text-slate-700">{message}</p>

        {formattedDetails ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              Detalles
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">
              {formattedDetails}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
