import { ChangeEvent, FormEvent, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import type { Experience, ExperienceDraft } from "../../_lib/types";
import type { WorkExperienceOperation } from "@/lib/api/profile";
import { EditingSectionHeader, ReadOnlySectionHeader } from "./ProfileSectionHeaders";
import { ProfileCollapsibleDescription } from "./ProfileCollapsibleDescription";
import { ProfileSectionAddButton, ProfileSectionFinalizeRow } from "./ProfileSectionEditActions";
import { isFutureMonthForYear } from "./ProfileSectionDateUtils";
import { ProfileYearMonthRangeFields } from "./ProfileYearMonthRangeFields";

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
  const [draft, setDraft] = useState<ExperienceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

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
      return `${startYear} - Presente`;
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

    const shouldDelete = window.confirm("¿Eliminar esta experiencia? Este cambio se guardará de inmediato.");
    if (!shouldDelete) {
      return;
    }

    setDraftError(null);
    onClearSaveError();
    const result = await onSaveOperations([{ action: "REMOVE", id }]);
    if (!result.ok) {
      setDraftError(result.message ?? "No pudimos eliminar la experiencia.");
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
      setDraftError("Completa todos los campos requeridos para agregar o actualizar una experiencia.");
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
      setDraftError(result.message ?? "No pudimos guardar la experiencia.");
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

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const listItems = experiences;

  if (isExperienceManagerMode) {
    return (
      <AppCard className="px-3 py-3 sm:px-4 sm:py-4">
        <EditingSectionHeader title="Experiencia" onBack={onCloseManager} isSaving={isSaving} />

        <ProfileSectionAddButton label="+ Agregar experiencia" onClick={onStartAdding} isSaving={isSaving} />

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
                    <p className="text-[0.72rem] font-bold leading-tight text-[var(--text-primary)]">{item.puestoTrabajo}</p>
                    <p className="mt-[0.1rem] text-[0.62rem] text-[var(--text-soft)]">
                      {item.lugarTrabajo} · {formatYearRange(item.fechaComienzo, item.fechaFinalizacion, item.trabajoActual)}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onEditExperience(item)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-[var(--text-soft)] hover:text-[var(--navy-900)]"
                    aria-label="Editar experiencia"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExperience(item.id)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-[var(--danger-500)] hover:opacity-85"
                    aria-label="Eliminar experiencia"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-[0.7rem] text-[var(--text-secondary)]">Todavia no agregaste experiencias laborales.</p>
        )}

        {isFormOpen ? (
          <form onSubmit={onSubmitExperience} className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-[0.8rem] font-semibold text-[var(--navy-900)]">
                {editingId ? "Editar experiencia" : "Nueva experiencia"}
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
                Lugar de trabajo
                <input
                  name="lugarTrabajo"
                  value={draft.lugarTrabajo}
                  onChange={onDraftChange}
                  placeholder="Mensa Empresarios"
                />
              </label>

              <label className="mathesis-field sm:col-span-1">
                Puesto de trabajo
                <input
                  name="puestoTrabajo"
                  value={draft.puestoTrabajo}
                  onChange={onDraftChange}
                  placeholder="Analista de Estrategia"
                />
              </label>

              <ProfileYearMonthRangeFields
                startLabel="Fecha de comienzo"
                endLabel="Fecha de finalizacion"
                currentLabel="Actualmente trabajo aqui"
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

              <label className="mathesis-field sm:col-span-2">
                Descripcion (max. 300)
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

            <button
              type="submit"
              disabled={isSaving}
              className="mt-5 inline-flex items-center rounded-full bg-[var(--brand-700)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
            >
              {editingId ? "Actualizar experiencia" : "Agregar experiencia"}
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

        <ProfileSectionFinalizeRow onFinalize={onCloseManager} isSaving={isSaving} />
      </AppCard>
    );
  }

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <ReadOnlySectionHeader title="Experiencia" canEdit={canEdit} onEdit={onStartEditing} />

      <div className="mt-2 border-t border-[var(--line)] pt-2">
        {listItems.length === 0 ? (
          <p className="text-[0.7rem] text-[var(--text-secondary)]">Todavia no agregaste experiencias laborales.</p>
        ) : (
          <ul>
            {listItems.map((item) => (
              <li
                key={item.id}
                className="border-b border-[var(--line)] py-[0.6rem] last:border-b-0 sm:py-[0.7rem]"
              >
                <div>
                  <p className="text-[0.72rem] font-bold leading-tight text-[var(--text-primary)]">{item.puestoTrabajo}</p>
                  <p className="mt-[0.1rem] text-[0.62rem] text-[var(--text-soft)]">
                    {item.lugarTrabajo} · {formatYearRange(item.fechaComienzo, item.fechaFinalizacion, item.trabajoActual)}
                    {defaultLocation?.trim() ? ` · ${defaultLocation.trim()}` : ""}
                  </p>
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
