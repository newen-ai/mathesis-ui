import { ChangeEvent, FormEvent, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import type { Experience, ExperienceDraft } from "../../_lib/types";
import type { WorkExperienceOperation } from "@/lib/api/profile";

const monthOptions = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const yearOptions = Array.from({ length: 70 }, (_, index) => String(currentYear - index));

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
  const [workingExperiences, setWorkingExperiences] = useState<Experience[]>(experiences);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const isExperienceManagerMode = canEdit && isEditingMode;

  const isFutureMonthForYear = (monthValue: string, yearValue: string) => {
    if (!monthValue || !yearValue) return false;
    if (Number(yearValue) < currentYear) return false;
    if (Number(yearValue) > currentYear) return true;
    return Number(monthValue) > currentMonth;
  };

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

  const areSameExperience = (a: Experience, b: Experience) =>
    a.lugarTrabajo === b.lugarTrabajo &&
    a.puestoTrabajo === b.puestoTrabajo &&
    a.descripcion === b.descripcion &&
    a.fechaComienzo === b.fechaComienzo &&
    a.fechaFinalizacion === b.fechaFinalizacion &&
    a.trabajoActual === b.trabajoActual;

  const buildOperations = (): WorkExperienceOperation[] => {
    const originalById = new Map(experiences.map((item) => [item.id, item]));
    const stagedById = new Map(workingExperiences.map((item) => [item.id, item]));
    const operations: WorkExperienceOperation[] = [];

    experiences.forEach((item) => {
      if (!stagedById.has(item.id)) {
        operations.push({ action: "REMOVE", id: item.id });
      }
    });

    workingExperiences.forEach((item) => {
      const original = originalById.get(item.id);
      const payload = {
        company: item.lugarTrabajo,
        jobTitle: item.puestoTrabajo,
        description: item.descripcion.trim(),
        startYearMonth: item.fechaComienzo,
        ...(item.trabajoActual || !item.fechaFinalizacion
          ? {}
          : { endYearMonth: item.fechaFinalizacion }),
      };

      if (!original) {
        operations.push({ action: "ADD", ...payload });
        return;
      }

      if (!areSameExperience(original, item)) {
        operations.push({ action: "EDIT", id: item.id, ...payload });
      }
    });

    return operations;
  };

  const onStartAdding = () => {
    resetDraft();
    setDraftError(null);
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
    setIsFormOpen(true);
  };

  const onDeleteExperience = (id: string) => {
    setWorkingExperiences((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const onSubmitExperience = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !draft.puestoTrabajo ||
      !draft.lugarTrabajo ||
      !draft.fechaComienzo ||
      (!draft.trabajoActual && !draft.fechaFinalizacion)
    ) {
      setDraftError("Completa todos los campos requeridos para agregar o actualizar una experiencia.");
      return;
    }

    if (editingId) {
      setWorkingExperiences((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...draft } : item))
      );
    } else {
      setWorkingExperiences((current) => [
        ...current,
        {
          id: `tmp-${crypto.randomUUID()}`,
          ...draft,
        },
      ]);
    }

    setDraftError(null);
    resetDraft();
    setIsFormOpen(false);
  };

  const onSaveAll = async () => {
    if (
      draft.puestoTrabajo.trim() ||
      draft.lugarTrabajo.trim() ||
      draft.descripcion.trim() ||
      draft.fechaComienzo ||
      draft.fechaFinalizacion
    ) {
      setDraftError("Tienes una experiencia en edicion. Guardala o cerrala antes de guardar cambios.");
      return;
    }

    const operations = buildOperations();
    if (operations.length === 0) {
      setDraftError("No hay cambios para guardar.");
      return;
    }

    setDraftError(null);
    const result = await onSaveOperations(operations);
    if (result.ok) {
      onClearSaveError();
      setIsFormOpen(false);
      resetDraft();
    }
  };

  const onDiscardChanges = () => {
    onClearSaveError();
    setWorkingExperiences(experiences);
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

  const listItems = isExperienceManagerMode ? workingExperiences : experiences;

  if (isExperienceManagerMode) {
    return (
      <AppCard className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDiscardChanges}
            disabled={isSaving}
            className="text-[1.25rem] leading-none text-[var(--navy-900)] disabled:opacity-60"
            aria-label="Volver"
          >
            ‹
          </button>
          <h3 className="font-[family-name:var(--font-spectral)] text-[2rem] font-semibold text-[var(--navy-900)]">
            Experiencia
          </h3>
        </div>

        <button
          type="button"
          onClick={onStartAdding}
          disabled={isSaving}
          className="mt-5 inline-flex items-center rounded-xl border border-[var(--brand-500)] bg-[var(--brand-50)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)] disabled:opacity-60"
        >
          + Agregar experiencia
        </button>

        {listItems.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
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
          <form onSubmit={onSubmitExperience} className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
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
              <label className="mensa-field sm:col-span-1">
                Lugar de trabajo
                <input
                  name="lugarTrabajo"
                  value={draft.lugarTrabajo}
                  onChange={onDraftChange}
                  placeholder="Mensa Empresarios"
                />
              </label>

              <label className="mensa-field sm:col-span-1">
                Puesto de trabajo
                <input
                  name="puestoTrabajo"
                  value={draft.puestoTrabajo}
                  onChange={onDraftChange}
                  placeholder="Analista de Estrategia"
                />
              </label>

              <label className="mensa-field sm:col-span-1">
                Fecha de comienzo
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={startMonth}
                    onChange={(event) => {
                      const month = event.target.value;
                      if (isFutureMonthForYear(month, startYear)) {
                        setStartMonth("");
                        pushDatePart("fechaComienzo", startYear, "");
                        return;
                      }
                      setStartMonth(month);
                      pushDatePart("fechaComienzo", startYear, month);
                    }}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Mes</option>
                    {monthOptions.map((month) => (
                      <option
                        key={month.value}
                        value={month.value}
                        disabled={isFutureMonthForYear(month.value, startYear)}
                      >
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startYear}
                    onChange={(event) => {
                      const year = event.target.value;
                      const normalizedMonth = isFutureMonthForYear(startMonth, year) ? "" : startMonth;
                      setStartYear(year);
                      setStartMonth(normalizedMonth);
                      pushDatePart("fechaComienzo", year, normalizedMonth);
                    }}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Año</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="mensa-field sm:col-span-1">
                Fecha de finalizacion
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={endMonth}
                    onChange={(event) => {
                      const month = event.target.value;
                      if (isFutureMonthForYear(month, endYear)) {
                        setEndMonth("");
                        pushDatePart("fechaFinalizacion", endYear, "");
                        return;
                      }
                      setEndMonth(month);
                      pushDatePart("fechaFinalizacion", endYear, month);
                    }}
                    disabled={draft.trabajoActual}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:bg-[var(--surface-2)] disabled:text-[var(--text-soft)]"
                  >
                    <option value="">Mes</option>
                    {monthOptions.map((month) => (
                      <option
                        key={month.value}
                        value={month.value}
                        disabled={isFutureMonthForYear(month.value, endYear)}
                      >
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endYear}
                    onChange={(event) => {
                      const year = event.target.value;
                      const normalizedMonth = isFutureMonthForYear(endMonth, year) ? "" : endMonth;
                      setEndYear(year);
                      setEndMonth(normalizedMonth);
                      pushDatePart("fechaFinalizacion", year, normalizedMonth);
                    }}
                    disabled={draft.trabajoActual}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:bg-[var(--surface-2)] disabled:text-[var(--text-soft)]"
                  >
                    <option value="">Año</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <input
                  name="trabajoActual"
                  type="checkbox"
                  checked={draft.trabajoActual}
                  onChange={onDraftChange}
                  className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
                />
                Actualmente trabajo aqui
              </label>

              <label className="mensa-field sm:col-span-2">
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onDiscardChanges}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Descartar cambios
          </button>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <h3 className="font-[family-name:var(--font-spectral)] text-[0.85rem] font-bold text-[var(--navy-900)]">
          Experiencia
        </h3>
        {canEdit ? (
          <button
            type="button"
            onClick={onStartEditing}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[0.62rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true">✎</span>
            Editar
          </button>
        ) : null}
      </div>

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
                  {item.descripcion.trim() ? (
                    <>
                      <p
                        className="mt-1 text-[0.64rem] leading-[1.5] text-[var(--text-secondary)]"
                        style={
                          !expandedDescriptions[item.id]
                            ? {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }
                            : undefined
                        }
                      >
                        {item.descripcion}
                      </p>
                      {item.descripcion.length > 120 ? (
                        <button
                          type="button"
                          onClick={() => toggleDescription(item.id)}
                          className="mt-1 text-[0.6rem] font-bold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
                        >
                          {expandedDescriptions[item.id] ? "menos" : "más"}
                        </button>
                      ) : null}
                    </>
                  ) : null}
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
