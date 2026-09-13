import { ChangeEvent, FormEvent, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { toDateLabel } from "../../_lib/utils/date";
import type { Education, EducationDraft } from "../../_lib/types";
import type { EducationOperation } from "@/lib/api/profile";
import { EditingSectionHeader, ReadOnlySectionHeader } from "./ProfileSectionHeaders";
import { ProfileCollapsibleDescription } from "./ProfileCollapsibleDescription";
import { ProfileSectionAddButton, ProfileSectionFinalizeRow } from "./ProfileSectionEditActions";
import { isFutureMonthForYear } from "./ProfileSectionDateUtils";
import { ProfileYearMonthRangeFields } from "./ProfileYearMonthRangeFields";

const splitYearMonth = (value: string) => {
  if (!value || value.length < 7) {
    return { year: "", month: "" };
  }

  const [year, month] = value.split("-");
  return { year: year ?? "", month: month ?? "" };
};

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
  const [draft, setDraft] = useState<EducationDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

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
      setDraftError("Completa todos los campos requeridos para agregar o actualizar una formacion.");
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
      setDraftError(result.message ?? "No pudimos guardar la formacion.");
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

    const shouldDelete = window.confirm("¿Eliminar esta formación? Este cambio se guardará de inmediato.");
    if (!shouldDelete) {
      return;
    }

    setDraftError(null);
    onClearSaveError();
    const result = await onSaveOperations([{ action: "REMOVE", id }]);
    if (!result.ok) {
      setDraftError(result.message ?? "No pudimos eliminar la formación.");
      return;
    }

    if (editingId === id) {
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const listItems = educations;

  if (isEducationManagerMode) {
    return (
      <AppCard className="px-3 py-3 sm:px-4 sm:py-4">
        <EditingSectionHeader title="Formacion academica" onBack={onCancelEditing} isSaving={isSaving} />

        <ProfileSectionAddButton label="+ Agregar formacion" onClick={onStartAdding} isSaving={isSaving} />

        {listItems.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {listItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-5 ${index < listItems.length - 1 ? "border-b border-[var(--line)]" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[1.2rem] leading-none text-[var(--text-soft)]">⋮⋮</span>
                  <div>
                    <p className="text-[0.72rem] font-bold leading-tight text-[var(--text-primary)]">{item.titulo}</p>
                    <p className="mt-[0.1rem] text-[0.62rem] text-[var(--text-soft)]">
                      {item.institucion} · {toDateLabel(item.fechaComienzo)} - {item.estudiandoActualmente ? "Actualidad" : toDateLabel(item.fechaFinalizacion)}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onEditEducation(item)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-[var(--text-soft)] hover:text-[var(--navy-900)]"
                    aria-label="Editar formacion"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEducation(item.id)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-[var(--danger-500)] hover:opacity-85"
                    aria-label="Eliminar formacion"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-[0.7rem] text-[var(--text-secondary)]">Todavia no agregaste formacion academica.</p>
        )}

        {isFormOpen ? (
          <form onSubmit={onSubmitEducation} className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-[0.8rem] font-semibold text-[var(--navy-900)]">
                {editingId ? "Editar formacion" : "Nueva formacion"}
              </h4>
              <button
                type="button"
                onClick={() => {
                  resetDraft();
                  setDraftError(null);
                  setIsFormOpen(false);
                }}
                className="text-[0.66rem] font-semibold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="mathesis-field sm:col-span-1">
                Institucion
                <input
                  name="institucion"
                  value={draft.institucion}
                  onChange={onDraftChange}
                  placeholder="Universidad de Buenos Aires"
                />
              </label>

              <label className="mathesis-field sm:col-span-1">
                Titulo
                <input
                  name="titulo"
                  value={draft.titulo}
                  onChange={onDraftChange}
                  placeholder="Licenciatura"
                />
              </label>

              <label className="mathesis-field sm:col-span-2">
                Campo de estudio
                <input
                  name="campoEstudio"
                  value={draft.campoEstudio}
                  onChange={onDraftChange}
                  placeholder="Fisica teorica"
                />
              </label>

              <ProfileYearMonthRangeFields
                startLabel="Fecha de comienzo"
                endLabel="Fecha de finalizacion"
                currentLabel="Actualmente estudio aqui"
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

              <label className="mathesis-field sm:col-span-2">
                Descripcion (max. 300)
                <textarea
                  name="descripcion"
                  value={draft.descripcion}
                  onChange={onDraftChange}
                  maxLength={300}
                  rows={4}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-5 inline-flex items-center rounded-full bg-[var(--brand-700)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
            >
              {editingId ? "Actualizar formacion" : "Agregar formacion"}
            </button>

            {draftError ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {draftError}
              </p>
            ) : null}
          </form>
        ) : null}

        {saveError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}

        {!saveError && draftError && !isFormOpen ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            {draftError}
          </p>
        ) : null}

        <ProfileSectionFinalizeRow onFinalize={onCancelEditing} isSaving={isSaving} />
      </AppCard>
    );
  }

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <ReadOnlySectionHeader title="Formacion academica" canEdit={canEdit} onEdit={onStartEditing} />

      <div className="mt-2 border-t border-[var(--line)] pt-2">
        {listItems.length === 0 ? (
          <p className="text-[0.7rem] text-[var(--text-secondary)]">Todavia no agregaste formacion academica.</p>
        ) : (
          <ul>
            {listItems.map((item) => (
              <li
                key={item.id}
                className="border-b border-[var(--line)] py-[0.6rem] last:border-b-0 sm:py-[0.7rem]"
              >
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--text-primary)]">{item.titulo}</p>
                  <p className="mt-[0.1rem] text-[0.62rem] text-[var(--text-secondary)]">
                    {item.institucion} · {toDateLabel(item.fechaComienzo)} - {item.estudiandoActualmente ? "Actualidad" : toDateLabel(item.fechaFinalizacion)}
                  </p>
                  {item.campoEstudio ? (
                    <p className="mt-1 text-[0.64rem] text-[var(--text-secondary)]">{item.campoEstudio}</p>
                  ) : null}
                  <ProfileCollapsibleDescription
                    text={item.descripcion}
                    isExpanded={Boolean(expandedDescriptions[item.id])}
                    onToggle={() => toggleDescription(item.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {saveError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}
      </div>
    </AppCard>
  );
}
