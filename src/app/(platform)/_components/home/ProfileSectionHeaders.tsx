import { useTranslation } from "react-i18next";

type ReadOnlySectionHeaderProps = {
  title: string;
  canEdit: boolean;
  onEdit: () => void;
};

export function ReadOnlySectionHeader({ title, canEdit, onEdit }: ReadOnlySectionHeaderProps) {
  const { t } = useTranslation("profile");

  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
      <h3 className="font-display text-scale-4 font-bold text-[var(--navy-900)]">
        {title}
      </h3>
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-scale-1 font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
        >
          <span aria-hidden="true">✎</span>
          {t("common.edit")}
        </button>
      ) : null}
    </div>
  );
}