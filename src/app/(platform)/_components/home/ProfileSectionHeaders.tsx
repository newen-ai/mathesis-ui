type EditingSectionHeaderProps = {
  title: string;
  onBack: () => void;
  isSaving: boolean;
};

type ReadOnlySectionHeaderProps = {
  title: string;
  canEdit: boolean;
  onEdit: () => void;
};

export function EditingSectionHeader({ title, onBack, isSaving }: EditingSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={isSaving}
        className="text-[1.25rem] leading-none text-[var(--navy-900)] disabled:opacity-60"
        aria-label="Volver"
      >
        ‹
      </button>
      <h3 className="font-[family-name:var(--font-spectral)] text-[2rem] font-semibold text-[var(--navy-900)]">
        {title}
      </h3>
    </div>
  );
}

export function ReadOnlySectionHeader({ title, canEdit, onEdit }: ReadOnlySectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
      <h3 className="font-[family-name:var(--font-spectral)] text-[0.85rem] font-bold text-[var(--navy-900)]">
        {title}
      </h3>
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[0.62rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
        >
          <span aria-hidden="true">✎</span>
          Editar
        </button>
      ) : null}
    </div>
  );
}