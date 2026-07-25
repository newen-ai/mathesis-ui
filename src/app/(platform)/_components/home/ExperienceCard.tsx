import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { toDateLabel } from "../../_lib/utils/date";
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

const splitYearMonth = (value: string) => {
  if (!value || value.length < 7) {
    return { year: "", month: "" };
  }

  const [year, month] = value.split("-");
  return { year: year ?? "", month: month ?? "" };
};

const emptyDraft: ExperienceDraft = {
  puestoTrabajo: "",
  lugarTrabajo: "",
  fechaComienzo: "",
  fechaFinalizacion: "",
  trabajoActual: false,
};

type ExperienceCardProps = {
  experiences: Experience[];
  canEdit: boolean;
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
  isSaving,
  saveError,
  onSaveOperations,
  onClearSaveError,
}: ExperienceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ExperienceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workingExperiences, setWorkingExperiences] = useState<Experience[]>(
    experiences
  );

  useEffect(() => {
    if (!isEditing) {
      setWorkingExperiences(experiences);
    }
  }, [experiences, isEditing]);

  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false);
      resetDraft();
    }
  }, [canEdit]);

  const beginDate = splitYearMonth(draft.fechaComienzo);
  const endDate = splitYearMonth(draft.fechaFinalizacion);
  const [beginMonth, setBeginMonth] = useState(beginDate.month);
  const [beginYear, setBeginYear] = useState(beginDate.year);
  const [endMonth, setEndMonth] = useState(endDate.month);
  const [endYear, setEndYear] = useState(endDate.year);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBeginMonth(beginDate.month);
    setBeginYear(beginDate.year);
  }, [beginDate.month, beginDate.year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEndMonth(endDate.month);
    setEndYear(endDate.year);
  }, [endDate.month, endDate.year]);

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
    const value =
      nextYear && nextMonth
        ? `${nextYear}-${nextMonth}`
        : "";

    setDraft((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const onStartMonthChange = (month: string) => {
    if (isFutureMonthForYear(month, beginYear)) {
      setBeginMonth("");
      pushDatePart("fechaComienzo", beginYear, "");
      return;
    }

    setBeginMonth(month);
    pushDatePart("fechaComienzo", beginYear, month);
  };

  const onStartYearChange = (year: string) => {
    const normalizedMonth = isFutureMonthForYear(beginMonth, year)
      ? ""
      : beginMonth;

    setBeginYear(year);
    setBeginMonth(normalizedMonth);
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
    const normalizedMonth = isFutureMonthForYear(endMonth, year)
      ? ""
      : endMonth;

    setEndYear(year);
    setEndMonth(normalizedMonth);
    pushDatePart("fechaFinalizacion", year, normalizedMonth);
  };

  const onDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = event.target;

    if (name === "trabajoActual") {
      setDraft((current) => ({
        ...current,
        trabajoActual: checked,
        fechaFinalizacion: checked ? "" : current.fechaFinalizacion,
      }));
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
  };

  const onStartEditing = () => {
    onClearSaveError();
    setWorkingExperiences(experiences);
    resetDraft();
    setIsEditing(true);
  };

  const onCancelEditing = () => {
    onClearSaveError();
    setWorkingExperiences(experiences);
    resetDraft();
    setIsEditing(false);
  };

  const areSameExperience = (a: Experience, b: Experience) =>
    a.lugarTrabajo === b.lugarTrabajo &&
    a.puestoTrabajo === b.puestoTrabajo &&
    a.fechaComienzo === b.fechaComienzo &&
    a.fechaFinalizacion === b.fechaFinalizacion &&
    a.trabajoActual === b.trabajoActual;

  const buildOperations = (): WorkExperienceOperation[] => {
    const originalById = new Map(experiences.map((item) => [item.id, item]));
    const stagedById = new Map(workingExperiences.map((item) => [item.id, item]));

    const operations: WorkExperienceOperation[] = [];

    experiences.forEach((item) => {
      if (!stagedById.has(item.id)) {
        operations.push({
          action: "REMOVE",
          id: item.id,
        });
      }
    });

    workingExperiences.forEach((item) => {
      const original = originalById.get(item.id);

      if (!original) {
        operations.push({
          action: "ADD",
          company: item.lugarTrabajo,
          jobTitle: item.puestoTrabajo,
          startYearMonth: item.fechaComienzo,
          ...(item.trabajoActual || !item.fechaFinalizacion
            ? {}
            : { endYearMonth: item.fechaFinalizacion }),
        });
        return;
      }

      if (!areSameExperience(original, item)) {
        operations.push({
          action: "EDIT",
          id: item.id,
          company: item.lugarTrabajo,
          jobTitle: item.puestoTrabajo,
          startYearMonth: item.fechaComienzo,
          ...(item.trabajoActual || !item.fechaFinalizacion
            ? {}
            : { endYearMonth: item.fechaFinalizacion }),
        });
      }
    });

    return operations;
  };

  const onSubmitExperience = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !draft.puestoTrabajo ||
      !draft.lugarTrabajo ||
      !draft.fechaComienzo ||
      (!draft.trabajoActual && !draft.fechaFinalizacion)
    ) {
      return;
    }

    if (editingId) {
      setWorkingExperiences((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...draft } : item
        )
      );
      resetDraft();
      return;
    }

    setWorkingExperiences((current) => [
      ...current,
      {
        id: `tmp-${crypto.randomUUID()}`,
        ...draft,
      },
    ]);
    resetDraft();
  };

  const onEditExperience = (item: Experience) => {
    setEditingId(item.id);
    setDraft({
      puestoTrabajo: item.puestoTrabajo,
      lugarTrabajo: item.lugarTrabajo,
      fechaComienzo: item.fechaComienzo,
      fechaFinalizacion: item.fechaFinalizacion,
      trabajoActual: item.trabajoActual,
    });
  };

  const onDeleteExperience = (id: string) => {
    setWorkingExperiences((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetDraft();
    }
  };

  const onSaveAll = async () => {
    const operations = buildOperations();
    const result = await onSaveOperations(operations);

    if (result.ok) {
      onClearSaveError();
      setIsEditing(false);
      resetDraft();
    }
  };

  const listItems = isEditing ? workingExperiences : experiences;

  return (
    <AppCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-slate-900">
          Experiencia laboral
        </h3>
        {canEdit && isEditing ? (
          <button
            type="button"
            onClick={onCancelEditing}
            disabled={isSaving}
            className="text-sm font-medium text-[var(--brand-700)] hover:text-[var(--brand-900)]"
          >
            Cancelar edicion
          </button>
        ) : canEdit ? (
          <button
            type="button"
            onClick={onStartEditing}
            className="inline-flex items-center rounded-xl border border-[var(--brand-700)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)]"
          >
            Editar
          </button>
        ) : null}
      </div>

      {canEdit && isEditing ? (
        <form onSubmit={onSubmitExperience} className="mt-4">
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
                  value={beginMonth}
                  onChange={(event) => onStartMonthChange(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option value="">Mes</option>
                  {monthOptions.map((month) => (
                    <option
                      key={month.value}
                      value={month.value}
                      disabled={isFutureMonthForYear(month.value, beginYear)}
                    >
                      {month.label}
                    </option>
                  ))}
                </select>

                <select
                  value={beginYear}
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
                  disabled={draft.trabajoActual}
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
                  disabled={draft.trabajoActual}
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
                name="trabajoActual"
                type="checkbox"
                checked={draft.trabajoActual}
                onChange={onDraftChange}
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
              />
              Actualmente trabajo aqui
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 inline-flex items-center rounded-full bg-[var(--brand-700)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
          >
            {editingId ? "Actualizar experiencia" : "Agregar experiencia"}
          </button>
        </form>
      ) : null}

      <div className="mt-5 border-t border-slate-100 pt-4">
        {listItems.length === 0 ? (
          <p className="text-sm text-slate-600">
            Todavia no agregaste experiencias laborales.
          </p>
        ) : (
          <ul className="space-y-3">
            {listItems.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.lugarTrabajo}
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {item.puestoTrabajo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {toDateLabel(item.fechaComienzo)} - {item.trabajoActual ? "Actualidad" : toDateLabel(item.fechaFinalizacion)}
                  </p>
                </div>

                {canEdit && isEditing ? (
                  <div className="mt-3 flex gap-4 text-xs font-semibold">
                    <button
                      type="button"
                      className="text-[var(--brand-700)] hover:text-[var(--brand-900)]"
                      disabled={isSaving}
                      onClick={() => onEditExperience(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-rose-600 hover:text-rose-700"
                      disabled={isSaving}
                      onClick={() => onDeleteExperience(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {saveError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}

        {canEdit && isEditing ? (
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
              Cancelar
            </button>
          </div>
        ) : null}
      </div>
    </AppCard>
  );
}
