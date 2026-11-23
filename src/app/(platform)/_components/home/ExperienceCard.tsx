import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import type { Experience, ExperienceDraft } from "../../_lib/types";
import type { WorkExperienceOperation } from "@/lib/api/profile";
import { ReadOnlySectionHeader } from "./ProfileSectionHeaders";
import { ProfileCollapsibleText, ProfileShowAllToggle } from "./ProfileCollapsibleText";
import {
  ProfileEditModal,
  ProfileModalError,
  ProfileModalPrimaryButton,
  ProfileModalSecondaryButton,
} from "./ProfileEditModal";
import { isFutureMonthForYear } from "./ProfileSectionDateUtils";
import { ProfileYearMonthRangeFields } from "./ProfileYearMonthRangeFields";

const COLLAPSED_ITEMS_COUNT = 3;

const emptyDraft: ExperienceDraft = {
  puestoTrabajo: "",
  lugarTrabajo: "",
  descripcion: "",
  fechaComienzo: "",
  fechaFinalizacion: "",
  trabajoActual: false,
};

type ExperienceCardProps = {
  experiences: Experience[];
  canEdit: boolean;
  isEditingMode: boolean;
  onStartEditing: () => void;
  onCloseEditing: () => void;
  defaultLocation?: string;
  isSaving: boolean;
  saveError: string | null;
  onSaveOperations: (
    operations: WorkExperienceOperation[]
  ) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

export function ExperienceCard({
  experiences,
  canEdit,
  isEditingMode,
  onStartEditing,
  onCloseEditing,
  defaultLocation,
  isSaving,
  saveError,
  onSaveOperations,
  onClearSaveError,
}: ExperienceCardProps) {
  const { t } = useTranslation("profile");
  const [draft, setDraft] = useState<ExperienceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);

  const isExperienceManagerMode = canEdit && isEditingMode;

  const pushDatePart = (
    fieldName: "fechaComienzo" | "fechaFinalizacion",
    nextYear: string,
    nextMonth: string
  ) => {
    const value = nextYear && nextMonth ? `${nextYear}-${nextMonth}` : "";
    setDraft((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const onDraftChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = event.target;
    const checked = "checked" in event.target ? event.target.checked : false;

    if (name === "trabajoActual") {
      setDraft((current) => ({
        ...current,
        trabajoActual: checked,
        fechaFinalizacion: checked ? "" : current.fechaFinalizacion,
      }));

      if (checked) {
        setEndMonth("");
        setEndYear("");
      }
      return;
    }

    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
  };

  const formatYearRange = (start: string, end: string, isCurrent: boolean) => {
    const startYear = start.slice(0, 4);
    if (isCurrent || !end) {
      return `${startYear} - ${t("experience.present")}`;
    }
    return `${startYear} - ${end.slice(0, 4)}`;
  };

  const onStartAdding = () => {
    resetDraft();
    setDraftError(null);
    onClearSaveError();
    setIsFormOpen(true);
  };

  const onEditExperience = (item: Experience) => {
    setEditingId(item.id);
    setDraftError(null);
    setDraft({
      puestoTrabajo: item.puestoTrabajo,
      lugarTrabajo: item.lugarTrabajo,
      descripcion: item.descripcion,
      fechaComienzo: item.fechaComienzo,
      fechaFinalizacion: item.fechaFinalizacion,
      trabajoActual: item.trabajoActual,
    });

    setStartYear(item.fechaComienzo.slice(0, 4));
    setStartMonth(item.fechaComienzo.slice(5, 7));
    setEndYear(item.fechaFinalizacion ? item.fechaFinalizacion.slice(0, 4) : "");
    setEndMonth(item.fechaFinalizacion ? item.fechaFinalizacion.slice(5, 7) : "");
    onClearSaveError();
    setIsFormOpen(true);
  };

  const onStartMonthChange = (month: string) => {
    if (isFutureMonthForYear(month, startYear)) {
      setStartMonth("");
      pushDatePart("fechaComienzo", startYear, "");
      return;
    }

    setStartMonth(month);
    pushDatePart("fechaComienzo", startYear, month);
  };

  const onStartYearChange = (year: string) => {
    const normalizedMonth = isFutureMonthForYear(startMonth, year) ? "" : startMonth;

    setStartYear(year);
    setStartMonth(normalizedMonth);
    pushDatePart("fechaComienzo", year, normalizedMonth);
  };

  const onEndMonthChange = (month: string) => {
    if (isFutureMonthForYear(month, endYear)) {
      setEndMonth("");
      pushDatePart("fechaFinalizacion", endYear, "");
      return;
    }

    setEndMonth(month);
    pushDatePart("fechaFinalizacion", endYear, month);
  };

  const onEndYearChange = (year: string) => {
    const normalizedMonth = isFutureMonthForYear(endMonth, year) ? "" : endMonth;

    setEndYear(year);
    setEndMonth(normalizedMonth);
    pushDatePart("fechaFinalizacion", year, normalizedMonth);
  };

  const onCurrentWorkingChange = (checked: boolean) => {
    setDraft((current) => ({
      ...current,
      trabajoActual: checked,
      fechaFinalizacion: checked ? "" : current.fechaFinalizacion,
    }));

    if (checked) {
      setEndMonth("");
      setEndYear("");
    }
  };

  const onDeleteExperience = async (id: string) => {
    if (isSaving) {
      return;
    }

    const shouldDelete = window.confirm(t("experience.confirmDelete"));
    if (!shouldDelete) {
      return;
    }

    setDraftError(null);
    onClearSaveError();
    const result = await onSaveOperations([{ action: "REMOVE", id }]);
    if (!result.ok) {
      setDraftError(result.message ?? t("experience.errors.delete"));
      return;
    }

    if (editingId === id) {
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const onSubmitExperience = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !draft.puestoTrabajo.trim() ||
      !draft.lugarTrabajo.trim() ||
      !draft.fechaComienzo ||
      (!draft.trabajoActual && !draft.fechaFinalizacion)
    ) {
      setDraftError(t("experience.errors.required"));
      return;
    }

    const payload = {
      company: draft.lugarTrabajo.trim(),
      jobTitle: draft.puestoTrabajo.trim(),
      description: draft.descripcion.trim(),
      startYearMonth: draft.fechaComienzo,
      ...(draft.trabajoActual || !draft.fechaFinalizacion
        ? {}
        : { endYearMonth: draft.fechaFinalizacion }),
    };

    const originalItem = editingId
      ? experiences.find((item) => item.id === editingId)
      : null;

    const operations: WorkExperienceOperation[] = editingId
      ? originalItem?.fechaFinalizacion && draft.trabajoActual
        ? [
            { action: "REMOVE", id: editingId },
            { action: "ADD", ...payload },
          ]
        : [{ action: "EDIT", id: editingId, ...payload }]
      : [{ action: "ADD", ...payload }];

    onClearSaveError();
    setDraftError(null);
    const result = await onSaveOperations(operations);
    if (!result.ok) {
      setDraftError(result.message ?? t("experience.errors.save"));
      return;
    }

    resetDraft();
    setIsFormOpen(false);
  };

  const onCloseManager = () => {
    onClearSaveError();
    setDraftError(null);
    resetDraft();
    setIsFormOpen(false);
    onCloseEditing();
  };

  const listItems = experiences;

  const onBackToList = () => {
    resetDraft();
    setDraftError(null);
    setIsFormOpen(false);
  };

  const visibleItems = isShowingAll ? listItems : listItems.slice(0, COLLAPSED_ITEMS_COUNT);

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <ReadOnlySectionHeader title={t("experience.title")} canEdit={canEdit} onEdit={onStartEditing} />

      <div className="mt-2 border-t border-[var(--line)] pt-2">
        {listItems.length === 0 ? (
          <p className="text-scale-2 text-[var(--text-secondary)]">{t("experience.empty")}</p>
        ) : (
          <>
            <ul>
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-[var(--line)] py-[0.6rem] last:border-b-0 sm:py-[0.7rem]"
                >
                  <p className="text-scale-3 font-bold leading-tight text-[var(--text-primary)] [overflow-wrap:anywhere]">{item.puestoTrabajo}</p>
                  <p className="mt-[0.1rem] text-scale-2 text-[var(--text-soft)] [overflow-wrap:anywhere]">
                    {item.lugarTrabajo} · {formatYearRange(item.fechaComienzo, item.fechaFinalizacion, item.trabajoActual)}
                    {defaultLocation?.trim() ? ` · ${defaultLocation.trim()}` : ""}
                  </p>
                  <ProfileCollapsibleText
                    text={item.descripcion}
                    lines={3}
                    className="mt-2 text-scale-2 leading-[1.5] text-[var(--text-secondary)]"
                  />
                </li>
              ))}
            </ul>
            <ProfileShowAllToggle
              hiddenCount={listItems.length - COLLAPSED_ITEMS_COUNT}
              isShowingAll={isShowingAll}
              onToggle={() => setIsShowingAll((current) => !current)}
            />
          </>
        )}
      </div>

      {isExperienceManagerMode ? (
        <ProfileEditModal
          title={isFormOpen ? (editingId ? t("experience.editTitle") : t("experience.new")) : t("experience.title")}
          onClose={onCloseManager}
          isBusy={isSaving}
          headerStart={
            isFormOpen ? (
              <button
                type="button"
                onClick={onBackToList}
                disabled={isSaving}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[1.4rem] leading-none text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:opacity-60"
                aria-label={t("common.back")}
              >
                ‹
              </button>
            ) : null
          }
          footer={
            isFormOpen ? (
              <>
                <ProfileModalSecondaryButton onClick={onBackToList} disabled={isSaving}>
                  {t("common.cancel")}
                </ProfileModalSecondaryButton>
                <ProfileModalPrimaryButton type="submit" form="experience-edit-form" disabled={isSaving}>
                  {isSaving ? t("common.saving") : editingId ? t("experience.update") : t("experience.addAction")}
                </ProfileModalPrimaryButton>
              </>
            ) : (
              <ProfileModalPrimaryButton onClick={onCloseManager} disabled={isSaving}>
                {t("common.finalize")}
              </ProfileModalPrimaryButton>
            )
          }
        >
          {isFormOpen ? (
            <form id="experience-edit-form" onSubmit={onSubmitExperience}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sophium-field sm:col-span-1">
                  {t("experience.labels.workplace")}
                  <input
                    name="lugarTrabajo"
                    value={draft.lugarTrabajo}
                    onChange={onDraftChange}
                    placeholder={t("experience.placeholders.workplace")}
                  />
                </label>

                <label className="sophium-field sm:col-span-1">
                  {t("experience.labels.jobTitle")}
                  <input
                    name="puestoTrabajo"
                    value={draft.puestoTrabajo}
                    onChange={onDraftChange}
                    placeholder={t("experience.placeholders.jobTitle")}
                  />
                </label>

                <ProfileYearMonthRangeFields
                  startLabel={t("experience.labels.startDate")}
                  endLabel={t("experience.labels.endDate")}
                  currentLabel={t("experience.labels.currentlyWorking")}
                  currentChecked={draft.trabajoActual}
                  startMonth={startMonth}
                  startYear={startYear}
                  endMonth={endMonth}
                  endYear={endYear}
                  onStartMonthChange={onStartMonthChange}
                  onStartYearChange={onStartYearChange}
                  onEndMonthChange={onEndMonthChange}
                  onEndYearChange={onEndYearChange}
                  onCurrentChange={onCurrentWorkingChange}
                />

                <label className="sophium-field sm:col-span-2">
                  {t("experience.labels.description")}
                  <textarea
                    name="descripcion"
                    value={draft.descripcion}
                    onChange={onDraftChange}
                    maxLength={300}
                    rows={4}
                  />
                  <span className="text-right text-xs text-[var(--text-soft)]">{draft.descripcion.length}/300</span>
                </label>
              </div>

              <ProfileModalError message={draftError} tone="warning" />
              <ProfileModalError message={saveError} />
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={onStartAdding}
                disabled={isSaving}
                className="inline-flex items-center rounded-xl border border-[var(--brand-500)] bg-[var(--brand-50)] px-4 py-2 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)] disabled:opacity-60"
              >
                {t("experience.add")}
              </button>

              {listItems.length > 0 ? (
                <ul className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  {listItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-scale-3 font-bold leading-tight text-[var(--text-primary)]">{item.puestoTrabajo}</p>
                        <p className="mt-[0.1rem] truncate text-scale-2 text-[var(--text-soft)]">
                          {item.lugarTrabajo} · {formatYearRange(item.fechaComienzo, item.fechaFinalizacion, item.trabajoActual)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExperience(item)}
                          disabled={isSaving}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[1rem] leading-none text-[var(--text-soft)] transition hover:bg-[var(--surface-2)] hover:text-[var(--navy-900)] disabled:opacity-60"
                          aria-label={t("experience.aria.edit")}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExperience(item.id)}
                          disabled={isSaving}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[1rem] leading-none text-[var(--danger-500)] transition hover:bg-[var(--surface-2)] disabled:opacity-60"
                          aria-label={t("experience.aria.delete")}
                        >
                          🗑
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-scale-2 text-[var(--text-secondary)]">{t("experience.empty")}</p>
              )}

              <ProfileModalError message={draftError} tone="warning" />
              <ProfileModalError message={saveError} />
            </>
          )}
        </ProfileEditModal>
      ) : null}
    </AppCard>
  );
}
