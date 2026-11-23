import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import { toDateLabel } from "../../_lib/utils/date";
import type { Education, EducationDraft } from "../../_lib/types";
import type { EducationOperation } from "@/lib/api/profile";
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

const splitYearMonth = (value: string) => {
  if (!value || value.length < 7) {
    return { year: "", month: "" };
  }

  const [year, month] = value.split("-");
  return { year: year ?? "", month: month ?? "" };
};

const COLLAPSED_ITEMS_COUNT = 3;

const emptyDraft: EducationDraft = {
  institucion: "",
  titulo: "",
  campoEstudio: "",
  fechaComienzo: "",
  fechaFinalizacion: "",
  estudiandoActualmente: false,
  descripcion: "",
};

type EducationCardProps = {
  educations: Education[];
  canEdit: boolean;
  isEditingMode: boolean;
  onStartEditing: () => void;
  onCloseEditing: () => void;
  isSaving: boolean;
  saveError: string | null;
  onSaveOperations: (
    operations: EducationOperation[]
  ) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

export function EducationCard({
  educations,
  canEdit,
  isEditingMode,
  onStartEditing,
  onCloseEditing,
  isSaving,
  saveError,
  onSaveOperations,
  onClearSaveError,
}: EducationCardProps) {
  const { t, i18n } = useTranslation("profile");
  const [draft, setDraft] = useState<EducationDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);

  const isEducationManagerMode = canEdit && isEditingMode;

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

  const applyDateParts = (dateValue: string, field: "start" | "end") => {
    const parsed = splitYearMonth(dateValue);

    if (field === "start") {
      setStartYear(parsed.year);
      setStartMonth(parsed.month);
      return;
    }

    setEndYear(parsed.year);
    setEndMonth(parsed.month);
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

  const onDraftChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = event.target;
    const checked = "checked" in event.target ? event.target.checked : false;

    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onCurrentStudyingChange = (checked: boolean) => {
    setDraft((current) => ({
      ...current,
      estudiandoActualmente: checked,
      fechaFinalizacion: checked ? "" : current.fechaFinalizacion,
    }));

    if (checked) {
      setEndMonth("");
      setEndYear("");
    }
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setDraftError(null);
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
  };

  const onCancelEditing = () => {
    onClearSaveError();
    setDraftError(null);
    resetDraft();
    setIsFormOpen(false);
    onCloseEditing();
  };

  const onSubmitEducation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !draft.institucion.trim() ||
      !draft.titulo.trim() ||
      !draft.fechaComienzo ||
      (!draft.estudiandoActualmente && !draft.fechaFinalizacion)
    ) {
      setDraftError(t("education.errors.required"));
      return;
    }

    const payload = {
      institution: draft.institucion.trim(),
      degree: draft.titulo.trim(),
      ...(draft.campoEstudio.trim() ? { fieldOfStudy: draft.campoEstudio.trim() } : {}),
      startYearMonth: draft.fechaComienzo,
      ...(draft.estudiandoActualmente || !draft.fechaFinalizacion
        ? {}
        : { endYearMonth: draft.fechaFinalizacion }),
      ...(draft.descripcion.trim() ? { description: draft.descripcion.trim() } : {}),
    };

    const originalItem = editingId
      ? educations.find((item) => item.id === editingId)
      : null;

    const operations: EducationOperation[] = editingId
      ? originalItem?.fechaFinalizacion && draft.estudiandoActualmente
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
      setDraftError(result.message ?? t("education.errors.save"));
      return;
    }

    resetDraft();
    setIsFormOpen(false);
  };

  const onStartAdding = () => {
    resetDraft();
    setDraftError(null);
    onClearSaveError();
    setIsFormOpen(true);
  };

  const onEditEducation = (item: Education) => {
    setEditingId(item.id);
    setDraftError(null);
    setDraft({
      institucion: item.institucion,
      titulo: item.titulo,
      campoEstudio: item.campoEstudio,
      fechaComienzo: item.fechaComienzo,
      fechaFinalizacion: item.fechaFinalizacion,
      estudiandoActualmente: item.estudiandoActualmente,
      descripcion: item.descripcion,
    });

    applyDateParts(item.fechaComienzo, "start");
    applyDateParts(item.fechaFinalizacion, "end");
    onClearSaveError();
    setIsFormOpen(true);
  };

  const onDeleteEducation = async (id: string) => {
    if (isSaving) {
      return;
    }

    const shouldDelete = window.confirm(t("education.confirmDelete"));
    if (!shouldDelete) {
      return;
    }

    setDraftError(null);
    onClearSaveError();
    const result = await onSaveOperations([{ action: "REMOVE", id }]);
    if (!result.ok) {
      setDraftError(result.message ?? t("education.errors.delete"));
      return;
    }

    if (editingId === id) {
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const listItems = educations;

  const onBackToList = () => {
    resetDraft();
    setDraftError(null);
    setIsFormOpen(false);
  };

  const visibleItems = isShowingAll ? listItems : listItems.slice(0, COLLAPSED_ITEMS_COUNT);

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <ReadOnlySectionHeader title={t("education.title")} canEdit={canEdit} onEdit={onStartEditing} />

      <div className="mt-2 border-t border-[var(--line)] pt-2">
        {listItems.length === 0 ? (
          <p className="text-scale-2 text-[var(--text-secondary)]">{t("education.empty")}</p>
        ) : (
          <>
            <ul>
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-[var(--line)] py-[0.6rem] last:border-b-0 sm:py-[0.7rem]"
                >
                  <p className="text-scale-3 font-bold leading-tight text-[var(--text-primary)] [overflow-wrap:anywhere]">{item.titulo}</p>
                  <p className="mt-[0.1rem] text-scale-2 text-[var(--text-soft)] [overflow-wrap:anywhere]">
                    {item.institucion} · {toDateLabel(item.fechaComienzo, i18n.language)} - {item.estudiandoActualmente ? t("common.current") : toDateLabel(item.fechaFinalizacion, i18n.language)}
                  </p>
                  {item.campoEstudio ? (
                    <p className="mt-1 text-scale-2 text-[var(--text-secondary)] [overflow-wrap:anywhere]">{item.campoEstudio}</p>
                  ) : null}
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

      {isEducationManagerMode ? (
        <ProfileEditModal
          title={isFormOpen ? (editingId ? t("education.editTitle") : t("education.new")) : t("education.title")}
          onClose={onCancelEditing}
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
                <ProfileModalPrimaryButton type="submit" form="education-edit-form" disabled={isSaving}>
                  {isSaving ? t("common.saving") : editingId ? t("education.update") : t("education.addAction")}
                </ProfileModalPrimaryButton>
              </>
            ) : (
              <ProfileModalPrimaryButton onClick={onCancelEditing} disabled={isSaving}>
                {t("common.finalize")}
              </ProfileModalPrimaryButton>
            )
          }
        >
          {isFormOpen ? (
            <form id="education-edit-form" onSubmit={onSubmitEducation}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sophium-field sm:col-span-1">
                  {t("education.labels.institution")}
                  <input
                    name="institucion"
                    value={draft.institucion}
                    onChange={onDraftChange}
                    placeholder={t("education.placeholders.institution")}
                  />
                </label>

                <label className="sophium-field sm:col-span-1">
                  {t("education.labels.degree")}
                  <input
                    name="titulo"
                    value={draft.titulo}
                    onChange={onDraftChange}
                    placeholder={t("education.placeholders.degree")}
                  />
                </label>

                <label className="sophium-field sm:col-span-2">
                  {t("education.labels.field")}
                  <input
                    name="campoEstudio"
                    value={draft.campoEstudio}
                    onChange={onDraftChange}
                    placeholder={t("education.placeholders.field")}
                  />
                </label>

                <ProfileYearMonthRangeFields
                  startLabel={t("education.labels.startDate")}
                  endLabel={t("education.labels.endDate")}
                  currentLabel={t("education.labels.currentlyStudying")}
                  currentChecked={draft.estudiandoActualmente}
                  startMonth={startMonth}
                  startYear={startYear}
                  endMonth={endMonth}
                  endYear={endYear}
                  onStartMonthChange={onStartMonthChange}
                  onStartYearChange={onStartYearChange}
                  onEndMonthChange={onEndMonthChange}
                  onEndYearChange={onEndYearChange}
                  onCurrentChange={onCurrentStudyingChange}
                />

                <label className="sophium-field sm:col-span-2">
                  {t("education.labels.description")}
                  <textarea
                    name="descripcion"
                    value={draft.descripcion}
                    onChange={onDraftChange}
                    maxLength={300}
                    rows={4}
                  />
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
                {t("education.add")}
              </button>

              {listItems.length > 0 ? (
                <ul className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  {listItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-scale-3 font-bold leading-tight text-[var(--text-primary)]">{item.titulo}</p>
                        <p className="mt-[0.1rem] truncate text-scale-2 text-[var(--text-soft)]">
                          {item.institucion} · {toDateLabel(item.fechaComienzo, i18n.language)} - {item.estudiandoActualmente ? t("common.current") : toDateLabel(item.fechaFinalizacion, i18n.language)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditEducation(item)}
                          disabled={isSaving}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[1rem] leading-none text-[var(--text-soft)] transition hover:bg-[var(--surface-2)] hover:text-[var(--navy-900)] disabled:opacity-60"
                          aria-label={t("education.aria.edit")}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEducation(item.id)}
                          disabled={isSaving}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[1rem] leading-none text-[var(--danger-500)] transition hover:bg-[var(--surface-2)] disabled:opacity-60"
                          aria-label={t("education.aria.delete")}
                        >
                          🗑
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-scale-2 text-[var(--text-secondary)]">{t("education.empty")}</p>
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
