import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";

type ProfileFormCardProps = {
  profile: Profile;
  canEdit: boolean;
  isEditingMode: boolean;
  onStartEditing: () => void;
  onCloseEditing: () => void;
  profileCompletion: number;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

export function ProfileFormCard({
  profile,
  canEdit,
  isEditingMode,
  onStartEditing,
  onCloseEditing,
  profileCompletion,
  isLoading,
  isSaving,
  saveError,
  onSave,
  onClearSaveError,
}: ProfileFormCardProps) {
  const { t } = useTranslation("profile");
  const [formState, setFormState] = useState<Profile>(profile);

  const onCancel = () => {
    setFormState(profile);
    onClearSaveError();
    onCloseEditing();
  };

  const onSubmitSave = async () => {
    const result = await onSave(formState);
    if (result.ok) {
      setFormState(profile);
      onCloseEditing();
    }
  };

  const onFormChange = (name: Exclude<keyof Profile, "intereses">, value: string) => {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3" id="profile-form-card">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-2">
        <h2 className="font-[family-name:var(--font-spectral)] text-[0.85rem] font-bold text-[var(--navy-900)]">
          {canEdit && isEditingMode ? t("profileForm.title.editing") : t("profileForm.title.about")}
        </h2>
        {canEdit && !isEditingMode ? (
          <button
            type="button"
            onClick={onStartEditing}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[0.62rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true">✎</span>
            {t("common.edit")}
          </button>
        ) : null}
      </div>

      {canEdit && isEditingMode ? (
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
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {isLoading ? (
          <p className="text-[0.68rem] text-[var(--text-secondary)]">{t("profileForm.loading")}</p>
        ) : canEdit && isEditingMode ? (
          <>
            <label className="sophium-field">
              {t("profileForm.fields.firstName")}
              <input
                value={formState.nombre}
                onChange={(event) => onFormChange("nombre", event.target.value)}
              />
            </label>
            <label className="sophium-field">
              {t("profileForm.fields.lastName")}
              <input
                value={formState.apellido}
                onChange={(event) => onFormChange("apellido", event.target.value)}
              />
            </label>
            <label className="sophium-field">
              {t("profileForm.fields.birthDate")}
              <input
                type="date"
                value={formState.fechaNacimiento}
                onChange={(event) =>
                  onFormChange("fechaNacimiento", event.target.value)
                }
              />
            </label>
            <label className="sophium-field">
              {t("profileForm.fields.nationality")}
              <input
                value={formState.nacionalidad}
                onChange={(event) =>
                  onFormChange("nacionalidad", event.target.value)
                }
              />
            </label>
            <label className="sophium-field sm:col-span-2">
              {t("profileForm.fields.headline")}
              <input
                value={formState.puesto}
                maxLength={80}
                onChange={(event) => onFormChange("puesto", event.target.value)}
              />
              <span className="text-right text-xs text-[var(--text-soft)]">{formState.puesto.length}/80</span>
            </label>
            <label className="sophium-field sm:col-span-2">
              {t("profileForm.fields.currentCompany")}
              <input
                value={formState.empresaActual}
                onChange={(event) =>
                  onFormChange("empresaActual", event.target.value)
                }
              />
            </label>
            <label className="sophium-field">
              {t("profileForm.fields.country")}
              <input
                value={formState.locationCountry}
                onChange={(event) => onFormChange("locationCountry", event.target.value)}
              />
            </label>
            <label className="sophium-field">
              {t("profileForm.fields.city")}
              <input
                value={formState.locationCity}
                onChange={(event) => onFormChange("locationCity", event.target.value)}
              />
            </label>
            <label className="sophium-field sm:col-span-2">
              {t("profileForm.fields.postalCode")}
              <input
                value={formState.locationPostalCode}
                onChange={(event) => onFormChange("locationPostalCode", event.target.value)}
              />
            </label>
            <label className="sophium-field sm:col-span-2">
              {t("profileForm.fields.about")}
              <textarea
                value={formState.about}
                maxLength={800}
                rows={5}
                onChange={(event) => onFormChange("about", event.target.value)}
              />
              <span className="text-right text-xs text-[var(--text-soft)]">{formState.about.length}/800</span>
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
                  {isSaving ? t("common.saving") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                  {t("common.cancel")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2 pt-1">
              <p className="whitespace-pre-wrap break-words text-[0.7rem] leading-[1.55] text-[var(--text-primary)]">
                  {profile.about?.trim() || t("profileForm.emptyAbout")}
              </p>
            </div>
          </>
        )}
      </div>
    </AppCard>
  );
}
