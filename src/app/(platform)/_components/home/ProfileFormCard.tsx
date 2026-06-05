import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";

type ProfileFormCardProps = {
  profile: Profile;
  profileCompletion: number;
  isLoading: boolean;
};

type ProfileEntry = {
  label: string;
  value: string;
};

export function ProfileFormCard({ profile, profileCompletion, isLoading }: ProfileFormCardProps) {
  const fields: ProfileEntry[] = [
    { label: "Nombre", value: profile.nombre },
    { label: "Apellido", value: profile.apellido },
    { label: "Fecha de nacimiento", value: profile.fechaNacimiento },
    { label: "Nacionalidad", value: profile.nacionalidad },
    { label: "Puesto de trabajo", value: profile.puesto },
    { label: "Empresa actual", value: profile.empresaActual },
  ].filter((item) => Boolean(item.value?.trim()));

  return (
    <AppCard className="p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
        Perfil profesional
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Se muestran solo los datos recibidos y completos desde el servicio.
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
