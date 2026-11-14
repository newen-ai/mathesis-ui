import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";

const ABOUT_MAX_LENGTH = 800;

type ProfileAboutCardProps = {
  profile: Profile;
  canEdit: boolean;
  isEditingMode: boolean;
  onStartEditing: () => void;
  onCloseEditing: () => void;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

export function ProfileAboutCard({
  profile,
  canEdit,
  isEditingMode,
  onStartEditing,
  onCloseEditing,
  isLoading,
  isSaving,
  saveError,
  onSave,
  onClearSaveError,
}: ProfileAboutCardProps) {
  const { t } = useTranslation("profile");
  const [aboutDraft, setAboutDraft] = useState("");

  const onStart = () => {
    // The draft is taken from the latest loaded profile each time editing opens.
    setAboutDraft(profile.about);
    onClearSaveError();
    onStartEditing();
  };

  const onCancel = () => {
    onClearSaveError();
    onCloseEditing();
  };

  const onSubmitSave = async () => {
    const result = await onSave({ ...profile, about: aboutDraft });
    if (result.ok) {
      onCloseEditing();
    }
  };

  const isEditing = canEdit && isEditingMode;

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3" id="profile-about-card">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-2">
        <h2 className="font-[family-name:var(--font-spectral)] text-[0.85rem] font-bold text-[var(--navy-900)]">
          {t("profileForm.title.about")}
        </h2>
        {canEdit && !isEditingMode && !isLoading ? (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[0.62rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true">✎</span>
            {t("common.edit")}
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <p className="text-[0.68rem] text-[var(--text-secondary)]">{t("profileForm.loading")}</p>
        ) : isEditing ? (
          <div className="grid gap-3">
            <label className="sophium-field">
              {t("profileForm.fields.about")}
              <textarea
                value={aboutDraft}
                maxLength={ABOUT_MAX_LENGTH}
                rows={5}
                onChange={(event) => setAboutDraft(event.target.value)}
              />
              <span className="text-right text-xs text-[var(--text-soft)]">
                {aboutDraft.length}/{ABOUT_MAX_LENGTH}
              </span>
            </label>

            {saveError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
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
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words pt-1 text-[0.7rem] leading-[1.55] text-[var(--text-primary)]">
            {profile.about.trim() || t("profileForm.emptyAbout")}
          </p>
        )}
      </div>
    </AppCard>
  );
}
