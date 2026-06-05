import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";

type ProfileFormCardProps = {
  profile: Profile;
  profileCompletion: number;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

type ProfileEntry = {
  label: string;
  value: string;
};

export function ProfileFormCard({
  profile,
  profileCompletion,
  isLoading,
  isSaving,
  saveError,
  onSave,
  onClearSaveError,
}: ProfileFormCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<Profile>(profile);

  useEffect(() => {
    if (!isEditing) {
      setFormState(profile);
    }
  }, [isEditing, profile]);

  const fields: ProfileEntry[] = [
    { label: "Nombre", value: profile.nombre },
    { label: "Apellido", value: profile.apellido },
    { label: "Fecha de nacimiento", value: profile.fechaNacimiento },
    { label: "Nacionalidad", value: profile.nacionalidad },
    { label: "Puesto de trabajo", value: profile.puesto },
    { label: "Empresa actual", value: profile.empresaActual },
  ].filter((item) => Boolean(item.value?.trim()));

  const onEdit = () => {
    onClearSaveError();
    setFormState(profile);
    setIsEditing(true);
  };

  const onCancel = () => {
    setFormState({
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      nacionalidad: "",
      puesto: "",
      empresaActual: "",
    });
    onClearSaveError();
    setIsEditing(false);
  };

  const onSubmitSave = async () => {
    const result = await onSave(formState);
    if (result.ok) {
      setIsEditing(false);
    }
  };

  const onFormChange = (name: keyof Profile, value: string) => {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <AppCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
          Perfil profesional
        </h2>

        {!isLoading && !isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center rounded-xl border border-[var(--brand-700)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)]"
          >
            Editar
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {isEditing
          ? "Completa tu informacion basica y guarda los cambios."
          : "Se muestran solo los datos recibidos y completos desde el servicio."}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Completitud del perfil</span>
          <span>{profileCompletion}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[var(--brand-700)] transition-all"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {isLoading ? (
          <p className="text-sm text-slate-600">Cargando perfil...</p>
        ) : isEditing ? (
          <>
            <label className="mensa-field">
              Nombre
              <input
                value={formState.nombre}
                onChange={(event) => onFormChange("nombre", event.target.value)}
              />
            </label>
            <label className="mensa-field">
              Apellido
              <input
                value={formState.apellido}
                onChange={(event) => onFormChange("apellido", event.target.value)}
              />
            </label>
            <label className="mensa-field">
              Fecha de nacimiento
              <input
                type="date"
                value={formState.fechaNacimiento}
                onChange={(event) =>
                  onFormChange("fechaNacimiento", event.target.value)
                }
              />
            </label>
            <label className="mensa-field">
              Nacionalidad
              <input
                value={formState.nacionalidad}
                onChange={(event) =>
                  onFormChange("nacionalidad", event.target.value)
                }
              />
            </label>
            <label className="mensa-field sm:col-span-2">
              Puesto de trabajo
              <input
                value={formState.puesto}
                onChange={(event) => onFormChange("puesto", event.target.value)}
              />
            </label>
            <label className="mensa-field sm:col-span-2">
              Empresa actual
              <input
                value={formState.empresaActual}
                onChange={(event) =>
                  onFormChange("empresaActual", event.target.value)
                }
              />
            </label>

            {saveError ? (
              <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {saveError}
              </p>
            ) : null}

            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSubmitSave}
                disabled={isSaving}
                className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : fields.length === 0 ? (
          <p className="text-sm text-slate-600">No hay datos completos para mostrar.</p>
        ) : (
          fields.map((field) => (
            <div key={field.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{field.label}</p>
              <p className="mt-1 text-sm text-slate-900">{field.value}</p>
            </div>
          ))
        )}
      </div>
    </AppCard>
  );
}
