"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { emptyProfile } from "../constants";
import { Experience, Profile } from "../types";
import { readSession } from "@/lib/auth/session";
import {
  EmploymentHistoryInput,
  EmploymentHistoryOutput,
  getProfileByUserId,
  getMyProfile,
  patchWorkExperiences,
  PatchWorkExperiencesInput,
  ProfileOutput,
  saveMyProfile,
  SaveProfileInput,
  WorkExperienceOperation,
} from "@/lib/api/profile";

const DEFAULT_PROFILE_ID = "profile-default";

type ProfessionalProfileState = {
  profile: Profile;
  experiences: Experience[];
  profileId: string;
};

function normalizeExperience(item: Experience): Experience {
  return {
    ...item,
    puestoTrabajo: item.puestoTrabajo ?? "",
    fechaComienzo:
      item.fechaComienzo?.length === 10
        ? item.fechaComienzo.slice(0, 7)
        : item.fechaComienzo,
    fechaFinalizacion:
      item.fechaFinalizacion?.length === 10
        ? item.fechaFinalizacion.slice(0, 7)
        : item.fechaFinalizacion,
    trabajoActual: item.trabajoActual ?? !item.fechaFinalizacion,
  };
}

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

function mapProfileOutputToProfile(
  source: ProfileOutput
): Profile {
  return {
    nombre: source.firstName ?? "",
    apellido: source.lastName ?? "",
    fechaNacimiento: normalizeDateInputValue(source.dateOfBirth),
    nacionalidad: source.nationality ?? "",
    puesto: source.currentJobTitle ?? "",
    empresaActual: source.currentCompany ?? "",
  };
}

function mapEmploymentHistoryToExperience(
  items: EmploymentHistoryOutput[]
): Experience[] {
  return items.map((item) => {
    const fechaFinalizacion = normalizeYearMonth(item.endYearMonth);

    return {
      id: item.id,
      puestoTrabajo: item.jobTitle,
      lugarTrabajo: item.company,
      fechaComienzo: normalizeYearMonth(item.startYearMonth),
      fechaFinalizacion,
      trabajoActual: !fechaFinalizacion,
    };
  });
}

function mapExperiencesToEmploymentHistoryInput(
  items: Experience[]
): EmploymentHistoryInput[] {
  return items.map((item) => ({
    company: item.lugarTrabajo,
    jobTitle: item.puestoTrabajo,
    startYearMonth: item.fechaComienzo,
    ...(item.trabajoActual || !item.fechaFinalizacion
      ? {}
      : { endYearMonth: item.fechaFinalizacion }),
  }));
}

function mapProfileToSaveInput(
  profile: Profile,
  experiences: Experience[]
): SaveProfileInput {
  const isoDateOfBirth = profile.fechaNacimiento
    ? new Date(`${profile.fechaNacimiento}T00:00:00.000Z`).toISOString()
    : undefined;

  return {
    firstName: profile.nombre.trim(),
    lastName: profile.apellido.trim(),
    ...(isoDateOfBirth ? { dateOfBirth: isoDateOfBirth } : {}),
    ...(profile.nacionalidad.trim()
      ? { nationality: profile.nacionalidad.trim() }
      : {}),
    ...(profile.puesto.trim() ? { currentJobTitle: profile.puesto.trim() } : {}),
    ...(profile.empresaActual.trim()
      ? { currentCompany: profile.empresaActual.trim() }
      : {}),
    ...(experiences.length > 0
      ? {
          employmentHistory: mapExperiencesToEmploymentHistoryInput(experiences),
        }
      : {}),
  };
}

function buildInitialProfileState(): ProfessionalProfileState {
  const session = readSession();

  return {
    profile: emptyProfile,
    experiences: [],
    profileId: (session?.user.email || DEFAULT_PROFILE_ID).toLowerCase(),
  };
}

const isFutureYearMonth = (value: string) => {
  if (!value) return false;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const currentYearMonth = `${year}-${month}`;

  return value > currentYearMonth;
};

export const useProfessionalProfile = () => {
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId")?.trim() ?? "";
  const [state, setState] = useState<ProfessionalProfileState>(
    buildInitialProfileState
  );
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isSavingExperiences, setIsSavingExperiences] = useState(false);
  const [experienceSaveError, setExperienceSaveError] = useState<string | null>(null);
  const profile = state.profile;
  const activeProfileIdResolved = selectedUserId || state.profileId;

  const loadProfile = async (signal?: AbortSignal) => {
    const remoteProfile = selectedUserId
      ? await getProfileByUserId(selectedUserId, signal)
      : await getMyProfile(signal);

    setState((current) => ({
      ...current,
      profile: mapProfileOutputToProfile(remoteProfile),
      experiences: mapEmploymentHistoryToExperience(
        remoteProfile.employmentHistory ?? []
      ),
      ...(selectedUserId ? { profileId: selectedUserId } : {}),
    }));
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setIsProfileLoading(true);

    loadProfile(controller.signal)
      .then(() => {
        if (!isMounted) {
          return;
        }
      })
      .catch(() => {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          profile: emptyProfile,
          experiences: [],
        }));
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
  }, [selectedUserId]);

  const sortedExperiences = useMemo(() => {
    return [...state.experiences].sort((a, b) => {
      const startDiff = b.fechaComienzo.localeCompare(a.fechaComienzo);
      if (startDiff !== 0) return startDiff;
      return b.fechaFinalizacion.localeCompare(a.fechaFinalizacion);
    });
  }, [state.experiences]);

  const profileCompletion = useMemo(() => {
    const totalFields = 6;
    const completed = [
      profile.nombre,
      profile.apellido,
      profile.fechaNacimiento,
      profile.nacionalidad,
      profile.puesto,
      profile.empresaActual,
    ].filter(Boolean).length;

    return Math.round((completed / totalFields) * 100);
  }, [profile]);

  const userDisplayName =
    profile.nombre || profile.apellido
      ? `${profile.nombre} ${profile.apellido}`.trim()
      : "Nombre y apellido";

  const initials = `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`
    .toUpperCase()
    .trim();

  const refreshProfile = async () => {
    await loadProfile();
  };

  const persistWorkExperienceOperations = async (
    operations: PatchWorkExperiencesInput["operations"]
  ) => {
    setExperienceSaveError(null);
    setIsSavingExperiences(true);

    const result = await patchWorkExperiences({ operations });

    if (!result.success) {
      setExperienceSaveError(result.message);
      setIsSavingExperiences(false);
      return false;
    }

    try {
      await refreshProfile();
      return true;
    } catch {
      setExperienceSaveError("Experience was saved but refresh failed");
      return false;
    } finally {
      setIsSavingExperiences(false);
    }
  };

  const onSaveExperienceOperations = async (
    operations: WorkExperienceOperation[]
  ) => {
    if (operations.length === 0) {
      return { ok: true };
    }

    const saved = await persistWorkExperienceOperations(operations);
    if (!saved) {
      return { ok: false, message: experienceSaveError ?? "Save failed" };
    }

    return { ok: true };
  };

  const onSaveProfile = async (nextProfile: Profile) => {
    setProfileSaveError(null);
    setIsSavingProfile(true);

    const result = await saveMyProfile(
      mapProfileToSaveInput(nextProfile, state.experiences)
    );

    if (!result.success) {
      setProfileSaveError(result.message);
      setIsSavingProfile(false);
      return { ok: false, message: result.message };
    }

    try {
      await refreshProfile();

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
    activeProfileId: activeProfileIdResolved,
    profileCompletion,
    isProfileLoading,
    isSavingProfile,
    profileSaveError,
    isSavingExperiences,
    experienceSaveError,
    userDisplayName,
    initials,
    onSaveProfile,
    onSaveExperienceOperations,
    clearProfileSaveError: () => setProfileSaveError(null),
    clearExperienceSaveError: () => setExperienceSaveError(null),
  };
};
