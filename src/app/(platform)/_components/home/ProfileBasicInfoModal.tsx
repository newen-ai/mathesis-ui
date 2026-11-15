import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Profile } from "../../_lib/types";
import {
  ProfileEditModal,
  ProfileModalError,
  ProfileModalPrimaryButton,
  ProfileModalSecondaryButton,
} from "./ProfileEditModal";

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
    <ProfileEditModal
      title={t("profileForm.title.editing")}
      onClose={onClose}
      isBusy={isSaving}
      footer={
        <>
          <ProfileModalSecondaryButton onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </ProfileModalSecondaryButton>
          <ProfileModalPrimaryButton onClick={onSubmitSave} disabled={isSaving}>
            {isSaving ? t("common.saving") : t("common.save")}
          </ProfileModalPrimaryButton>
        </>
      }
    >
      <div>
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

      <ProfileModalError message={saveError} />
    </ProfileEditModal>
  );
}
