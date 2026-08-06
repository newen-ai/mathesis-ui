import { ChangeEvent, FormEvent, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { toDateLabel } from "../../_lib/utils/date";
import type { Education, EducationDraft } from "../../_lib/types";
import type { EducationOperation } from "@/lib/api/profile";

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
  const [workingEducations, setWorkingEducations] = useState<Education[]>(educations);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isEducationManagerMode = canEdit && isEditingMode;

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

    if (name === "estudiandoActualmente") {
      setDraft((current) => ({
        ...current,
        estudiandoActualmente: checked,
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
    setDraftError(null);
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
  };

  const onCancelEditing = () => {
    onClearSaveError();
    setDraftError(null);
    setWorkingEducations(educations);
    resetDraft();
    setIsFormOpen(false);
    onCloseEditing();
  };

  const areSameEducation = (a: Education, b: Education) =>
    a.institucion === b.institucion &&
    a.titulo === b.titulo &&
    a.campoEstudio === b.campoEstudio &&
    a.fechaComienzo === b.fechaComienzo &&
    a.fechaFinalizacion === b.fechaFinalizacion &&
    a.estudiandoActualmente === b.estudiandoActualmente &&
    a.descripcion === b.descripcion;

  const buildOperations = (): EducationOperation[] => {
    const originalById = new Map(educations.map((item) => [item.id, item]));
    const stagedById = new Map(workingEducations.map((item) => [item.id, item]));

    const operations: EducationOperation[] = [];

    educations.forEach((item) => {
      if (!stagedById.has(item.id)) {
        operations.push({ action: "REMOVE", id: item.id });
      }
    });

    workingEducations.forEach((item) => {
      const original = originalById.get(item.id);

      if (!original) {
        operations.push({
          action: "ADD",
          institution: item.institucion,
          degree: item.titulo,
          ...(item.campoEstudio.trim() ? { fieldOfStudy: item.campoEstudio.trim() } : {}),
          startYearMonth: item.fechaComienzo,
          ...(item.estudiandoActualmente || !item.fechaFinalizacion
            ? {}
            : { endYearMonth: item.fechaFinalizacion }),
          ...(item.descripcion.trim() ? { description: item.descripcion.trim() } : {}),
        });
        return;
      }

      if (!areSameEducation(original, item)) {
        operations.push({
          action: "EDIT",
          id: item.id,
          institution: item.institucion,
          degree: item.titulo,
          ...(item.campoEstudio.trim() ? { fieldOfStudy: item.campoEstudio.trim() } : {}),
          startYearMonth: item.fechaComienzo,
          ...(item.estudiandoActualmente || !item.fechaFinalizacion
            ? {}
            : { endYearMonth: item.fechaFinalizacion }),
          description: item.descripcion,
        });
      }
    });

    return operations;
  };

  const onSubmitEducation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !draft.institucion ||
      !draft.titulo ||
      !draft.fechaComienzo ||
      (!draft.estudiandoActualmente && !draft.fechaFinalizacion)
    ) {
      setDraftError("Completa todos los campos requeridos para agregar o actualizar una formacion.");
      return;
    }

    setDraftError(null);

    if (editingId) {
      setWorkingEducations((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...draft } : item))
      );
      resetDraft();
      setIsFormOpen(false);
      return;
    }

    setWorkingEducations((current) => [
      ...current,
      {
        id: `tmp-${crypto.randomUUID()}`,
        ...draft,
      },
    ]);
    resetDraft();
    setIsFormOpen(false);
  };

  const onStartAdding = () => {
    resetDraft();
    setDraftError(null);
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
    setIsFormOpen(true);
  };

  const onDeleteEducation = (id: string) => {
    setWorkingEducations((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const onSaveAll = async () => {
    if (
      draft.institucion.trim() ||
      draft.titulo.trim() ||
      draft.campoEstudio.trim() ||
      draft.fechaComienzo ||
      draft.fechaFinalizacion ||
      draft.descripcion.trim()
    ) {
      setDraftError("Tienes una formacion en edicion. Haz click en 'Agregar formacion' o 'Actualizar formacion' antes de guardar.");
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
      resetDraft();
      setIsFormOpen(false);
    }
  };

  const listItems = isEducationManagerMode ? workingEducations : educations;

  if (isEducationManagerMode) {
    return (
      <AppCard className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancelEditing}
            disabled={isSaving}
            className="text-[1.25rem] leading-none text-[var(--navy-900)] disabled:opacity-60"
            aria-label="Volver"
          >
            ‹
          </button>
          <h3 className="font-[family-name:var(--font-spectral)] text-[2rem] font-semibold text-[var(--navy-900)]">
            Formacion academica
          </h3>
        </div>

        <button
          type="button"
          onClick={onStartAdding}
          disabled={isSaving}
          className="mt-5 inline-flex items-center rounded-xl border border-[var(--brand-500)] bg-[var(--brand-50)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)] disabled:opacity-60"
        >
          + Agregar formacion
        </button>

        {listItems.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {listItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-5 ${index < listItems.length - 1 ? "border-b border-[var(--line)]" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[1.2rem] leading-none text-slate-500">⋮⋮</span>
                  <div>
                    <p className="text-[0.72rem] font-bold leading-tight text-slate-900">{item.titulo}</p>
                    <p className="mt-[0.1rem] text-[0.62rem] text-slate-500">
                      {item.institucion} · {toDateLabel(item.fechaComienzo)} - {item.estudiandoActualmente ? "Actualidad" : toDateLabel(item.fechaFinalizacion)}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onEditEducation(item)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-slate-500 hover:text-[var(--navy-900)]"
                    aria-label="Editar formacion"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEducation(item.id)}
                    disabled={isSaving}
                    className="text-[1.1rem] leading-none text-rose-700 hover:text-rose-800"
                    aria-label="Eliminar formacion"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-[0.7rem] text-slate-600">Todavia no agregaste formacion academica.</p>
        )}

        {isFormOpen ? (
          <form onSubmit={onSubmitEducation} className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
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
              <label className="mensa-field sm:col-span-1">
                Institucion
                <input
                  name="institucion"
                  value={draft.institucion}
                  onChange={onDraftChange}
                  placeholder="Universidad de Buenos Aires"
                />
              </label>

              <label className="mensa-field sm:col-span-1">
                Titulo
                <input
                  name="titulo"
                  value={draft.titulo}
                  onChange={onDraftChange}
                  placeholder="Licenciatura"
                />
              </label>

              <label className="mensa-field sm:col-span-2">
                Campo de estudio
                <input
                  name="campoEstudio"
                  value={draft.campoEstudio}
                  onChange={onDraftChange}
                  placeholder="Fisica teorica"
                />
              </label>

              <label className="mensa-field sm:col-span-1">
                Fecha de comienzo
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={startMonth}
                    onChange={(event) => onStartMonthChange(event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
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
                    onChange={(event) => onStartYearChange(event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
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
                    onChange={(event) => onEndMonthChange(event.target.value)}
                    disabled={draft.estudiandoActualmente}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
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
                    onChange={(event) => onEndYearChange(event.target.value)}
                    disabled={draft.estudiandoActualmente}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
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

              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  name="estudiandoActualmente"
                  type="checkbox"
                  checked={draft.estudiandoActualmente}
                  onChange={onDraftChange}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
                />
                Actualmente estudio aqui
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
            onClick={onCancelEditing}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
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
          Formacion academica
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

      <div className="mt-2 border-t border-slate-100 pt-2">
        {listItems.length === 0 ? (
          <p className="text-[0.7rem] text-slate-600">Todavia no agregaste formacion academica.</p>
        ) : (
          <ul>
            {listItems.map((item) => (
              <li
                key={item.id}
                className="border-b border-[var(--line)] py-[0.6rem] last:border-b-0 sm:py-[0.7rem]"
              >
                <div>
                  <p className="text-[0.72rem] font-bold text-slate-900">{item.titulo}</p>
                  <p className="mt-[0.1rem] text-[0.62rem] text-slate-600">
                    {item.institucion} · {toDateLabel(item.fechaComienzo)} - {item.estudiandoActualmente ? "Actualidad" : toDateLabel(item.fechaFinalizacion)}
                  </p>
                  {item.campoEstudio ? (
                    <p className="mt-1 text-[0.64rem] text-slate-700">{item.campoEstudio}</p>
                  ) : null}
                  {item.descripcion ? (
                    <p className="mt-2 text-[0.64rem] leading-[1.5] text-slate-600">{item.descripcion}</p>
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
