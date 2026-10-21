import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import { navItems } from "../../_lib/constants";
import type { Profile } from "../../_lib/types";
import { TopBar } from "../TopBar";

type ProfileInitializationViewProps = {
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

const emptyProfileState: Profile = {
  nombre: "",
  apellido: "",
  fechaNacimiento: "",
  nacionalidad: "",
  puesto: "",
  empresaActual: "",
  about: "",
  locationCountry: "",
  locationCity: "",
  locationPostalCode: "",
  intereses: [],
  imagenPerfilUrl: "",
  imagenBannerUrl: "",
};

export function ProfileInitializationView({
  isSaving,
  saveError,
  onSave,
  onClearSaveError,
}: ProfileInitializationViewProps) {
  const { t } = useTranslation("profile");
  const [formState, setFormState] = useState<Profile>(emptyProfileState);

  const canSubmit = useMemo(() => {
    return Boolean(formState.nombre.trim() && formState.apellido.trim());
  }, [formState.apellido, formState.nombre]);

  const onFormChange = (name: Exclude<keyof Profile, "intereses">, value: string) => {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const onSubmit = async () => {
    onClearSaveError();
    await onSave(formState);
  };

  return (
    <div className="mathesis-shell min-h-screen">
      <TopBar navItems={navItems} />

      <main className="mx-auto flex w-full max-w-4xl items-start px-4 py-6 sm:px-6 lg:px-8">
        <AppCard className="w-full p-5 sm:p-7">
          <div className="space-y-1">
            <h1 className="font-[family-name:var(--font-spectral)] text-3xl font-semibold text-[var(--text-primary)]">
              {t("initialization.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("initialization.description")}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="mathesis-field">
              {t("initialization.fields.firstName")}
              <input
                value={formState.nombre}
                onChange={(event) => onFormChange("nombre", event.target.value)}
                required
              />
            </label>
            <label className="mathesis-field">
              {t("initialization.fields.lastName")}
              <input
                value={formState.apellido}
                onChange={(event) => onFormChange("apellido", event.target.value)}
                required
              />
            </label>
            <label className="mathesis-field">
              {t("initialization.fields.birthDate")}
              <input
                type="date"
                value={formState.fechaNacimiento}
                onChange={(event) =>
                  onFormChange("fechaNacimiento", event.target.value)
                }
              />
            </label>
            <label className="mathesis-field">
              {t("initialization.fields.nationality")}
              <input
                value={formState.nacionalidad}
                onChange={(event) => onFormChange("nacionalidad", event.target.value)}
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.headline")}
              <input
                value={formState.puesto}
                maxLength={80}
                onChange={(event) => onFormChange("puesto", event.target.value)}
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.currentCompany")}
              <input
                value={formState.empresaActual}
                onChange={(event) => onFormChange("empresaActual", event.target.value)}
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.profileImageUrl")}
              <input
                value={formState.imagenPerfilUrl}
                onChange={(event) => onFormChange("imagenPerfilUrl", event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.bannerImageUrl")}
              <input
                value={formState.imagenBannerUrl}
                onChange={(event) => onFormChange("imagenBannerUrl", event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="mathesis-field">
              {t("initialization.fields.country")}
              <input
                value={formState.locationCountry}
                onChange={(event) => onFormChange("locationCountry", event.target.value)}
              />
            </label>
            <label className="mathesis-field">
              {t("initialization.fields.city")}
              <input
                value={formState.locationCity}
                onChange={(event) => onFormChange("locationCity", event.target.value)}
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.postalCode")}
              <input
                value={formState.locationPostalCode}
                onChange={(event) => onFormChange("locationPostalCode", event.target.value)}
              />
            </label>
            <label className="mathesis-field sm:col-span-2">
              {t("initialization.fields.about")}
              <textarea
                value={formState.about}
                maxLength={800}
                rows={5}
                onChange={(event) => onFormChange("about", event.target.value)}
              />
            </label>
          </div>

          {saveError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {saveError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSaving || !canSubmit}
              className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? t("common.saving") : t("initialization.saveProfile")}
            </button>
          </div>
        </AppCard>
      </main>
    </div>
  );
}
