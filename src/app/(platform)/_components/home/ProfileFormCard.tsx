import type { ChangeEvent } from "react";
import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";

type ProfileFormCardProps = {
  profile: Profile;
  onProfileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ProfileFormCard({
  profile,
  onProfileChange,
}: ProfileFormCardProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <AppCard className="p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
        Arma tu perfil
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Una comunidad de alto rendimiento necesita perfiles claros y accionables.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="mensa-field sm:col-span-1">
          Nombre
          <input
            name="nombre"
            value={profile.nombre}
            onChange={onProfileChange}
            placeholder="Ana"
            autoComplete="given-name"
            readOnly
          />
        </label>

        <label className="mensa-field sm:col-span-1">
          Apellido
          <input
            name="apellido"
            value={profile.apellido}
            onChange={onProfileChange}
            placeholder="Martinez"
            autoComplete="family-name"
            readOnly
          />
        </label>

        <label className="mensa-field sm:col-span-1">
          Fecha de nacimiento
          <input
            name="fechaNacimiento"
            type="date"
            value={profile.fechaNacimiento}
            onChange={onProfileChange}
            max={today}
          />
        </label>

        <label className="mensa-field sm:col-span-1">
          Nacionalidad
          <input
            name="nacionalidad"
            value={profile.nacionalidad}
            onChange={onProfileChange}
            placeholder="Argentina"
            autoComplete="country-name"
          />
        </label>

        <label className="mensa-field sm:col-span-2">
          Puesto de trabajo
          <input
            name="puesto"
            value={profile.puesto}
            onChange={onProfileChange}
            placeholder="Lider de Proyectos"
            autoComplete="organization-title"
          />
        </label>
      </div>
    </AppCard>
  );
}
