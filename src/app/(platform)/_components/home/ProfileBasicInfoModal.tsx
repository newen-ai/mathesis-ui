import { useState } from "react";
import {
  getBirthDateFieldError,
  shouldShowBirthDateError,
  type BirthDateFieldStatus,
} from "../../_lib/birthDate";
import { resolveCountryCode } from "../../_lib/countries";
import { BirthDateField } from "./BirthDateField";
import { NationalitySelect } from "./NationalitySelect";
import { computeProfileCompletion } from "../../_lib/profileCompletion";
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
  /** Loaded experience/education counts, so the completion bar can update live with the draft. */
  completionCounts: { experiences: number; educations: number };
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
  completionCounts,
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
    // Old free-text values that name a country become its code; anything else is kept as is.
    nacionalidad: resolveCountryCode(profile.nacionalidad) ?? profile.nacionalidad,
    puesto: profile.puesto,
    empresaActual: profile.empresaActual,
    locationCountry: profile.locationCountry,
    locationCity: profile.locationCity,
    locationPostalCode: profile.locationPostalCode,
  }));


  const profileCompletion = computeProfileCompletion({ ...profile, ...draft }, completionCounts);
  const [birthDateStatus, setBirthDateStatus] = useState<BirthDateFieldStatus>("complete");
  const [isBirthDateTouched, setIsBirthDateTouched] = useState(false);
  const birthDateError = getBirthDateFieldError(draft.fechaNacimiento, birthDateStatus);
  const showBirthDateError = shouldShowBirthDateError(birthDateError, isBirthDateTouched);

  const onFieldChange = (name: BasicInfoField, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const onSubmitSave = async () => {
    if (birthDateError) return;
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
          <ProfileModalPrimaryButton onClick={onSubmitSave} disabled={isSaving || Boolean(birthDateError)}>
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
        <div className="sophium-field" role="group" aria-labelledby="profile-birth-date-label">
          <span id="profile-birth-date-label">{t("profileForm.fields.birthDate")}</span>
          <BirthDateField
            value={draft.fechaNacimiento}
            labelledBy="profile-birth-date-label"
            onBlur={() => setIsBirthDateTouched(true)}
            onChange={(value, status) => {
              setBirthDateStatus(status);
              onFieldChange("fechaNacimiento", value);
            }}
          />
          {showBirthDateError && birthDateError ? (
            <span className="text-xs font-semibold text-[var(--danger-500)]">
              {t(`profileForm.errors.birthDate.${birthDateError}`)}
            </span>
          ) : null}
        </div>
        <label className="sophium-field">
          {t("profileForm.fields.nationality")}
          <NationalitySelect
            value={draft.nacionalidad}
            onChange={(code) => onFieldChange("nacionalidad", code)}
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
