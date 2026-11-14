import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppCard } from "@/components/ui/AppCard";
import type { Profile } from "../../_lib/types";
import { ProfileCollapsibleText } from "./ProfileCollapsibleText";
import {
  ProfileEditModal,
  ProfileModalError,
  ProfileModalPrimaryButton,
  ProfileModalSecondaryButton,
} from "./ProfileEditModal";
import { ReadOnlySectionHeader } from "./ProfileSectionHeaders";

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

  const onStart = () => {
    onClearSaveError();
    onStartEditing();
  };

  const onClose = () => {
    onClearSaveError();
    onCloseEditing();
  };

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3" id="profile-about-card">
      <ReadOnlySectionHeader
        title={t("profileForm.title.about")}
        canEdit={canEdit && !isLoading}
        onEdit={onStart}
      />

      <div className="mt-3">
        {isLoading ? (
          <p className="text-[0.68rem] text-[var(--text-secondary)]">{t("profileForm.loading")}</p>
        ) : profile.about.trim() ? (
          <ProfileCollapsibleText
            text={profile.about}
            lines={4}
            className="text-[0.7rem] leading-[1.55] text-[var(--text-primary)]"
          />
        ) : (
          <p className="text-[0.7rem] leading-[1.55] text-[var(--text-secondary)]">
            {t("profileForm.emptyAbout")}
          </p>
        )}
      </div>

      {canEdit && isEditingMode ? (
        <ProfileAboutModal
          initialAbout={profile.about}
          isSaving={isSaving}
          saveError={saveError}
          onSave={(about) => onSave({ ...profile, about })}
          onClose={onClose}
        />
      ) : null}
    </AppCard>
  );
}

type ProfileAboutModalProps = {
  initialAbout: string;
  isSaving: boolean;
  saveError: string | null;
  onSave: (about: string) => Promise<{ ok: boolean; message?: string }>;
  onClose: () => void;
};

/** Mounted only while editing, so the draft is always seeded from the latest loaded profile. */
function ProfileAboutModal({ initialAbout, isSaving, saveError, onSave, onClose }: ProfileAboutModalProps) {
  const { t } = useTranslation("profile");
  const [aboutDraft, setAboutDraft] = useState(initialAbout);

  const onSubmitSave = async () => {
    const result = await onSave(aboutDraft);
    if (result.ok) {
      onClose();
    }
  };

  return (
    <ProfileEditModal
      title={t("profileForm.title.about")}
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
      <label className="sophium-field">
        {t("profileForm.fields.about")}
        <textarea
          value={aboutDraft}
          maxLength={ABOUT_MAX_LENGTH}
          rows={8}
          autoFocus
          onChange={(event) => setAboutDraft(event.target.value)}
        />
        <span className="text-right text-xs text-[var(--text-soft)]">
          {aboutDraft.length}/{ABOUT_MAX_LENGTH}
        </span>
      </label>

      <ProfileModalError message={saveError} />
    </ProfileEditModal>
  );
}
