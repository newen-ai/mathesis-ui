"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { emptyProfile } from "../constants";
import { Education, Experience, Profile } from "../types";
import {
  EducationHistoryInput,
  EducationHistoryOutput,
  EducationOperation,
  EmploymentHistoryInput,
  EmploymentHistoryOutput,
  getMyProfileIdentity,
  getProfileByUserId,
  getMyProfile,
  isProfileSourceEmptyError,
  patchEducationHistory,
  patchWorkExperiences,
  PatchEducationHistoryInput,
  PatchWorkExperiencesInput,
  ProfileHttpError,
  ProfileOutput,
  saveMyProfile,
  SaveProfileInput,
  WorkExperienceOperation,
} from "@/lib/api/profile";
import { getTwoInitials } from "@/lib/utils/name";

type ProfessionalProfileState = {
  profile: Profile;
  experiences: Experience[];
  educations: Education[];
  badges: string[];
};

function normalizeYearMonth(value: string | null | undefined) {
  if (!value) return "";
  return value.length >= 7 ? value.slice(0, 7) : value;
}

function normalizeDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.length >= 10 ? value.slice(0, 10) : value;
}

function mapProfileOutputToProfile(source: ProfileOutput): Profile {
  return {
    nombre: source.firstName ?? "",
    apellido: source.lastName ?? "",
    fechaNacimiento: normalizeDateInputValue(source.dateOfBirth),
    nacionalidad: source.nationality ?? "",
    puesto: source.currentJobTitle ?? "",
    empresaActual: source.currentCompany ?? "",
    about: source.about ?? "",
    locationCountry: source.locationCountry ?? "",
    locationCity: source.locationCity ?? "",
    locationPostalCode: source.locationPostalCode ?? "",
    intereses: source.interests ?? [],
    imagenPerfilUrl: source.profileImageUrl ?? "",
    imagenBannerUrl: source.profileBannerImageUrl ?? "",
  };
}

function mapEmploymentHistoryToExperience(items: EmploymentHistoryOutput[]): Experience[] {
  return items.map((item) => {
    const fechaFinalizacion = normalizeYearMonth(item.endYearMonth);

    return {
      id: item.id,
      puestoTrabajo: item.jobTitle,
      lugarTrabajo: item.company,
      descripcion: item.description ?? "",
      fechaComienzo: normalizeYearMonth(item.startYearMonth),
      fechaFinalizacion,
      trabajoActual: !fechaFinalizacion,
    };
  });
}

function mapEducationHistoryToEducation(items: EducationHistoryOutput[]): Education[] {
  return items.map((item) => {
    const fechaFinalizacion = normalizeYearMonth(item.endYearMonth);

    return {
      id: item.id,
      institucion: item.institution,
      titulo: item.degree,
      campoEstudio: item.fieldOfStudy ?? "",
      fechaComienzo: normalizeYearMonth(item.startYearMonth),
      fechaFinalizacion,
      estudiandoActualmente: !fechaFinalizacion,
      descripcion: item.description ?? "",
    };
  });
}

function mapExperiencesToEmploymentHistoryInput(items: Experience[]): EmploymentHistoryInput[] {
  return items.map((item) => ({
    company: item.lugarTrabajo,
    jobTitle: item.puestoTrabajo,
    description: item.descripcion.trim(),
    startYearMonth: item.fechaComienzo,
    ...(item.trabajoActual || !item.fechaFinalizacion
      ? {}
      : { endYearMonth: item.fechaFinalizacion }),
  }));
}

function mapEducationsToEducationHistoryInput(items: Education[]): EducationHistoryInput[] {
  return items.map((item) => ({
    institution: item.institucion,
    degree: item.titulo,
    ...(item.campoEstudio.trim() ? { fieldOfStudy: item.campoEstudio.trim() } : {}),
    startYearMonth: item.fechaComienzo,
    ...(item.estudiandoActualmente || !item.fechaFinalizacion
      ? {}
      : { endYearMonth: item.fechaFinalizacion }),
    ...(item.descripcion.trim() ? { description: item.descripcion.trim() } : {}),
  }));
}

function mapProfileToSaveInput(
  profile: Profile,
  experiences: Experience[],
  educations: Education[]
): SaveProfileInput {
  const isoDateOfBirth = profile.fechaNacimiento
    ? new Date(`${profile.fechaNacimiento}T00:00:00.000Z`).toISOString()
    : undefined;

  return {
    firstName: profile.nombre.trim(),
    lastName: profile.apellido.trim(),
    ...(isoDateOfBirth ? { dateOfBirth: isoDateOfBirth } : {}),
    ...(profile.nacionalidad.trim() ? { nationality: profile.nacionalidad.trim() } : {}),
    ...(profile.puesto.trim() ? { currentJobTitle: profile.puesto.trim() } : {}),
    ...(profile.empresaActual.trim() ? { currentCompany: profile.empresaActual.trim() } : {}),
    ...(profile.about.trim() ? { about: profile.about.trim() } : {}),
    ...(profile.locationCountry.trim() ? { locationCountry: profile.locationCountry.trim() } : {}),
    ...(profile.locationCity.trim() ? { locationCity: profile.locationCity.trim() } : {}),
    ...(profile.locationPostalCode.trim()
      ? { locationPostalCode: profile.locationPostalCode.trim() }
      : {}),
    interests: profile.intereses,
    ...(profile.imagenPerfilUrl.trim()
      ? { profileImageUrl: profile.imagenPerfilUrl.trim() }
      : {}),
    ...(profile.imagenBannerUrl.trim()
      ? { profileBannerImageUrl: profile.imagenBannerUrl.trim() }
      : {}),
    ...(experiences.length > 0
      ? {
          employmentHistory: mapExperiencesToEmploymentHistoryInput(experiences),
        }
      : {}),
    ...(educations.length > 0
      ? {
          educationHistory: mapEducationsToEducationHistoryInput(educations),
        }
      : {}),
  };
}

function buildInitialProfileState(): ProfessionalProfileState {
  return {
    profile: emptyProfile,
    experiences: [],
    educations: [],
    badges: [],
  };
}

export const useProfessionalProfile = () => {
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId")?.trim() ?? "";

  const canEditProfile = !selectedUserId;

  const [state, setState] = useState<ProfessionalProfileState>(buildInitialProfileState);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [needsProfileInitialization, setNeedsProfileInitialization] = useState(false);
  const [isSavingExperiences, setIsSavingExperiences] = useState(false);
  const [experienceSaveError, setExperienceSaveError] = useState<string | null>(null);
  const [isSavingEducations, setIsSavingEducations] = useState(false);
  const [educationSaveError, setEducationSaveError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProfileUnavailable, setIsProfileUnavailable] = useState(false);
  const profile = state.profile;

  const loadProfile = useCallback(
    async (signal?: AbortSignal, withLoading = true) => {
      if (withLoading) {
        setIsProfileLoading(true);
      }

      const remoteProfile = selectedUserId
        ? await getProfileByUserId(selectedUserId, signal)
        : await getMyProfile(signal);

      setState((current) => ({
        ...current,
        profile: mapProfileOutputToProfile(remoteProfile),
        experiences: mapEmploymentHistoryToExperience(remoteProfile.employmentHistory ?? []),
        educations: mapEducationHistoryToEducation(remoteProfile.educationHistory ?? []),
        badges: (remoteProfile.badges ?? []).map((badge) => badge.slug),
      }));

      // Always resolved so a member-view of the own profile (`?userId=<own id>`) can be detected.
      const ownUserId = await getMyProfileIdentity(signal);
      setCurrentUserId(ownUserId);

      setNeedsProfileInitialization(false);
      setIsProfileUnavailable(false);
    },
    [selectedUserId]
  );

  const handleLoadProfileError = useCallback(
    (error: unknown) => {
      if (!selectedUserId && isProfileSourceEmptyError(error)) {
        setNeedsProfileInitialization(true);
      }

      if (
        selectedUserId &&
        error instanceof ProfileHttpError &&
        (error.status === 403 || error.status === 404)
      ) {
        setIsProfileUnavailable(true);
      } else {
        setIsProfileUnavailable(false);
      }

      setState((current) => ({
        ...current,
        profile: emptyProfile,
        experiences: [],
        educations: [],
        badges: [],
      }));
    },
    [selectedUserId]
  );

  const refetchProfile = useCallback(async () => {
    try {
      await loadProfile(undefined, false);
    } catch (error) {
      handleLoadProfileError(error);
    }
  }, [handleLoadProfileError, loadProfile]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile(controller.signal)
      .catch((error) => {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        handleLoadProfileError(error);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsProfileLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [handleLoadProfileError, loadProfile, selectedUserId]);

  const sortedExperiences = useMemo(() => {
    return [...state.experiences].sort((a, b) => {
      const startDiff = b.fechaComienzo.localeCompare(a.fechaComienzo);
      if (startDiff !== 0) return startDiff;
      return b.fechaFinalizacion.localeCompare(a.fechaFinalizacion);
    });
  }, [state.experiences]);

  const sortedEducations = useMemo(() => {
    return [...state.educations].sort((a, b) => {
      const startDiff = b.fechaComienzo.localeCompare(a.fechaComienzo);
      if (startDiff !== 0) return startDiff;
      return b.fechaFinalizacion.localeCompare(a.fechaFinalizacion);
    });
  }, [state.educations]);

  const profileCompletion = useMemo(() => {
    const totalFields = 12;
    const completed = [
      profile.nombre,
      profile.apellido,
      profile.fechaNacimiento,
      profile.nacionalidad,
      profile.puesto,
      profile.empresaActual,
      profile.about,
      profile.locationCountry,
      profile.locationCity,
      profile.locationPostalCode,
      profile.imagenPerfilUrl,
      profile.imagenBannerUrl,
    ].filter((item) => Boolean(item.trim())).length;

    return Math.round((completed / totalFields) * 100);
  }, [profile]);

  const userDisplayName =
    profile.nombre || profile.apellido
      ? `${profile.nombre} ${profile.apellido}`.trim()
      : "Nombre y apellido";

  const initials = getTwoInitials({
    firstName: profile.nombre,
    lastName: profile.apellido,
  });

  const refreshProfile = async () => {
    await loadProfile(undefined, false);
  };

  // Returns the error message (or null on success) so callers never read stale state.
  const persistWorkExperienceOperations = async (
    operations: PatchWorkExperiencesInput["operations"]
  ): Promise<string | null> => {
    setExperienceSaveError(null);
    setIsSavingExperiences(true);

    const result = await patchWorkExperiences({ operations });

    if (!result.success) {
      setExperienceSaveError(result.message);
      setIsSavingExperiences(false);
      return result.message;
    }

    try {
      await refreshProfile();
      return null;
    } catch {
      const refreshError = "Experience was saved but refresh failed";
      setExperienceSaveError(refreshError);
      return refreshError;
    } finally {
      setIsSavingExperiences(false);
    }
  };

  const persistEducationOperations = async (
    operations: PatchEducationHistoryInput["operations"]
  ): Promise<string | null> => {
    setEducationSaveError(null);
    setIsSavingEducations(true);

    const result = await patchEducationHistory({ operations });

    if (!result.success) {
      setEducationSaveError(result.message);
      setIsSavingEducations(false);
      return result.message;
    }

    try {
      await refreshProfile();
      return null;
    } catch {
      const refreshError = "Education was saved but refresh failed";
      setEducationSaveError(refreshError);
      return refreshError;
    } finally {
      setIsSavingEducations(false);
    }
  };

  const onSaveExperienceOperations = async (operations: WorkExperienceOperation[]) => {
    if (operations.length === 0) {
      return { ok: true };
    }

    const errorMessage = await persistWorkExperienceOperations(operations);
    if (errorMessage !== null) {
      return { ok: false, message: errorMessage || "Save failed" };
    }

    return { ok: true };
  };

  const onSaveEducationOperations = async (operations: EducationOperation[]) => {
    if (operations.length === 0) {
      return { ok: true };
    }

    const errorMessage = await persistEducationOperations(operations);
    if (errorMessage !== null) {
      return { ok: false, message: errorMessage || "Save failed" };
    }

    return { ok: true };
  };

  const onSaveProfile = async (nextProfile: Profile) => {
    setProfileSaveError(null);
    setIsSavingProfile(true);

    const result = await saveMyProfile(
      mapProfileToSaveInput(nextProfile, state.experiences, state.educations)
    );

    if (!result.success) {
      setProfileSaveError(result.message);
      setIsSavingProfile(false);
      return { ok: false, message: result.message };
    }

    try {
      await refreshProfile();
      setNeedsProfileInitialization(false);

      return { ok: true };
    } catch {
      const refreshError = "Profile was saved but refresh failed";
      setProfileSaveError(refreshError);
      return { ok: false, message: refreshError };
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    profile,
    sortedExperiences,
    sortedEducations,
    badges: state.badges,
    activeProfileId: selectedUserId,
    currentUserId,
    canEditProfile,
    isViewingOwnProfileAsMember: Boolean(selectedUserId) && selectedUserId === currentUserId,
    profileCompletion,
    isProfileLoading,
    isSavingProfile,
    profileSaveError,
    needsProfileInitialization,
    isProfileUnavailable,
    isSavingExperiences,
    experienceSaveError,
    isSavingEducations,
    educationSaveError,
    userDisplayName,
    initials,
    onSaveProfile,
    onSaveExperienceOperations,
    onSaveEducationOperations,
    clearProfileSaveError: () => setProfileSaveError(null),
    clearExperienceSaveError: () => setExperienceSaveError(null),
    clearEducationSaveError: () => setEducationSaveError(null),
    refetchProfile,
  };
};
