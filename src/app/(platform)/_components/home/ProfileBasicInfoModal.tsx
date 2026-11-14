import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Profile } from "../../_lib/types";

const HEADLINE_MAX_LENGTH = 80;

type BasicInfoField =
  | "nombre"
  | "apellido"
  | "fechaNacimiento"
  | "nacionalidad"
  | "puesto"
  | "empresaActual"
  | "locationCountry"
  | "locationCity"
  | "locationPostalCode";

type ProfileBasicInfoModalProps = {
  profile: Profile;
  profileCompletion: number;
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClose: () => void;
};

/**
 * Edits the profile base data (everything except "about", images and interests).
 * Mount it only while open: the draft is seeded from `profile` on mount.
 */
export function ProfileBasicInfoModal({
  profile,
  profileCompletion,
  isSaving,
  saveError,
  onSave,
  onClose,
}: ProfileBasicInfoModalProps) {
  const { t } = useTranslation("profile");
  const [draft, setDraft] = useState<Pick<Profile, BasicInfoField>>(() => ({
    nombre: profile.nombre,
    apellido: profile.apellido,
    fechaNacimiento: profile.fechaNacimiento,
    nacionalidad: profile.nacionalidad,
    puesto: profile.puesto,
    empresaActual: profile.empresaActual,
    locationCountry: profile.locationCountry,
    locationCity: profile.locationCity,
    locationPostalCode: profile.locationPostalCode,
  }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSaving, onClose]);

  const onFieldChange = (name: BasicInfoField, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const onSubmitSave = async () => {
    const result = await onSave({ ...profile, ...draft });
    if (result.ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-3 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-basic-info-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6"
      >
        <h3
          id="profile-basic-info-title"
          className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]"
        >
          {t("profileForm.title.editing")}
        </h3>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>{t("profileForm.completion")}</span>
            <span>{profileCompletion}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-2 rounded-full bg-[var(--brand-700)] transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sophium-field">
            {t("profileForm.fields.firstName")}
            <input
              value={draft.nombre}
              onChange={(event) => onFieldChange("nombre", event.target.value)}
            />
          </label>
          <label className="sophium-field">
            {t("profileForm.fields.lastName")}
            <input
              value={draft.apellido}
              onChange={(event) => onFieldChange("apellido", event.target.value)}
            />
          </label>
          <label className="sophium-field">
            {t("profileForm.fields.birthDate")}
            <input
              type="date"
              value={draft.fechaNacimiento}
              onChange={(event) => onFieldChange("fechaNacimiento", event.target.value)}
            />
          </label>
          <label className="sophium-field">
            {t("profileForm.fields.nationality")}
            <input
              value={draft.nacionalidad}
              onChange={(event) => onFieldChange("nacionalidad", event.target.value)}
            />
          </label>
          <label className="sophium-field sm:col-span-2">
            {t("profileForm.fields.headline")}
            <input
              value={draft.puesto}
              maxLength={HEADLINE_MAX_LENGTH}
              onChange={(event) => onFieldChange("puesto", event.target.value)}
            />
            <span className="text-right text-xs text-[var(--text-soft)]">
              {draft.puesto.length}/{HEADLINE_MAX_LENGTH}
            </span>
          </label>
          <label className="sophium-field sm:col-span-2">
            {t("profileForm.fields.currentCompany")}
            <input
              value={draft.empresaActual}
              onChange={(event) => onFieldChange("empresaActual", event.target.value)}
            />
          </label>
          <label className="sophium-field">
            {t("profileForm.fields.country")}
            <input
              value={draft.locationCountry}
              onChange={(event) => onFieldChange("locationCountry", event.target.value)}
            />
          </label>
          <label className="sophium-field">
            {t("profileForm.fields.city")}
            <input
              value={draft.locationCity}
              onChange={(event) => onFieldChange("locationCity", event.target.value)}
            />
          </label>
          <label className="sophium-field sm:col-span-2">
            {t("profileForm.fields.postalCode")}
            <input
              value={draft.locationPostalCode}
              onChange={(event) => onFieldChange("locationPostalCode", event.target.value)}
            />
          </label>
        </div>

        {saveError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmitSave}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
