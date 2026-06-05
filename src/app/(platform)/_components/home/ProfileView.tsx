"use client";

import {
  catchyLines,
  navItems,
  professionalStampLines,
} from "../../_lib/constants";
import { useProfessionalProfile } from "../../_lib/hooks/useProfessionalProfile";
import { TopBar } from "../TopBar";
import { CatchyPhrasesBanner } from "./CatchyPhrasesBanner";
import { ExperienceCard } from "./ExperienceCard";
import { LeftSidebar } from "./LeftSidebar";
import { ProfileFormCard } from "./ProfileFormCard";
import { RightSidebar } from "./RightSidebar";

export function ProfileView() {
  const {
    profile,
    draft,
    editingId,
    sortedExperiences,
    profileCompletion,
    isProfileLoading,
    userDisplayName,
    initials,
    handleDraftChange,
    resetDraft,
    onSubmitExperience,
    onEditExperience,
    onDeleteExperience,
  } = useProfessionalProfile();

  return (
    <div className="linkedin-shell min-h-screen">
      <TopBar navItems={navItems} />
      <CatchyPhrasesBanner lines={catchyLines} />

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)_290px] lg:items-start lg:px-8">
        <LeftSidebar
          initials={initials}
          userDisplayName={userDisplayName}
          puesto={profile.puesto}
          empresaActual={profile.empresaActual}
          profileCompletion={profileCompletion}
        />

        <section className="mensa-fade-up-delay space-y-4">
          <ProfileFormCard
            profile={profile}
            profileCompletion={profileCompletion}
            isLoading={isProfileLoading}
          />
          <ExperienceCard
            editingId={editingId}
            draft={draft}
            experiences={sortedExperiences}
            onDraftChange={handleDraftChange}
            onSubmitExperience={onSubmitExperience}
            onResetDraft={resetDraft}
            onEditExperience={onEditExperience}
            onDeleteExperience={onDeleteExperience}
          />
        </section>

        <RightSidebar professionalStampLines={professionalStampLines} />
      </main>
    </div>
  );
}
