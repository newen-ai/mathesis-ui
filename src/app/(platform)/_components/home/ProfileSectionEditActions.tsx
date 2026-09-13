type ProfileSectionAddButtonProps = {
  label: string;
  onClick: () => void;
  isSaving: boolean;
};

type ProfileSectionFinalizeRowProps = {
  onFinalize: () => void;
  isSaving: boolean;
};

export function ProfileSectionAddButton({
  label,
  onClick,
  isSaving,
}: ProfileSectionAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="mt-5 inline-flex items-center rounded-xl border border-[var(--brand-500)] bg-[var(--brand-50)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)] disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function ProfileSectionFinalizeRow({
  onFinalize,
  isSaving,
}: ProfileSectionFinalizeRowProps) {
  return (
    <div className="mt-4 flex justify-start">
      <button
        type="button"
        onClick={onFinalize}
        disabled={isSaving}
        className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:opacity-60"
      >
        Finalizar
      </button>
    </div>
  );
}