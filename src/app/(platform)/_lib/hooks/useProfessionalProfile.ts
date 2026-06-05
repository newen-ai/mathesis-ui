"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { emptyExperience, emptyProfile } from "../constants";
import { Experience, ExperienceDraft, Profile } from "../types";
import { readSession } from "@/lib/auth/session";
import {
  EmploymentHistoryOutput,
  getMyProfile,
  ProfileOutput,
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
  return items.map((item, index) => {
    const fechaFinalizacion = normalizeYearMonth(item.endYearMonth);

    return {
      id: `${item.company}-${item.jobTitle}-${item.startYearMonth}-${index}`,
      puestoTrabajo: item.jobTitle,
      lugarTrabajo: item.company,
      fechaComienzo: normalizeYearMonth(item.startYearMonth),
      fechaFinalizacion,
      trabajoActual: !fechaFinalizacion,
    };
  });
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
  const [state, setState] = useState<ProfessionalProfileState>(
    buildInitialProfileState
  );
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [draft, setDraft] = useState<ExperienceDraft>(emptyExperience);
  const [editingId, setEditingId] = useState<string | null>(null);
  const profile = state.profile;
  const activeProfileIdResolved = state.profileId;

  useEffect(() => {
    const controller = new AbortController();

    getMyProfile(controller.signal)
      .then((remoteProfile) => {
        setState((current) => ({
          ...current,
          profile: mapProfileOutputToProfile(remoteProfile),
          experiences: mapEmploymentHistoryToExperience(
            remoteProfile.employmentHistory ?? []
          ),
        }));
      })
      .catch(() => {
        setState((current) => ({
          ...current,
          profile: emptyProfile,
          experiences: [],
        }));
      })
      .finally(() => {
        setIsProfileLoading(false);
      });

    return () => controller.abort();
  }, []);

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

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "nombre" || name === "apellido") return;

    setState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [name]: value,
      },
    }));
  };

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = event.target;

    if (name === "trabajoActual") {
      setDraft((current) => ({
        ...current,
        trabajoActual: checked,
        fechaFinalizacion: checked ? "" : current.fechaFinalizacion,
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetDraft = () => {
    setDraft(emptyExperience);
    setEditingId(null);
  };

  const onSubmitExperience = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !draft.puestoTrabajo ||
      !draft.lugarTrabajo ||
      !draft.fechaComienzo ||
      (!draft.trabajoActual && !draft.fechaFinalizacion)
    ) {
      return;
    }

    if (
      isFutureYearMonth(draft.fechaComienzo) ||
      (!draft.trabajoActual && isFutureYearMonth(draft.fechaFinalizacion))
    ) {
      return;
    }

    if (editingId) {
      setState((current) => ({
        ...current,
        experiences: current.experiences.map((item) =>
          item.id === editingId ? { ...item, ...draft } : item
        ),
      }));
      resetDraft();
      return;
    }

    setState((current) => ({
      ...current,
      experiences: [
        ...current.experiences,
        {
          id: crypto.randomUUID(),
          ...draft,
        },
      ],
    }));

    resetDraft();
  };

  const onEditExperience = (item: Experience) => {
    setEditingId(item.id);
    setDraft({
      puestoTrabajo: item.puestoTrabajo,
      lugarTrabajo: item.lugarTrabajo,
      fechaComienzo: item.fechaComienzo,
      fechaFinalizacion: item.fechaFinalizacion,
      trabajoActual: item.trabajoActual,
    });
  };

  const onDeleteExperience = (id: string) => {
    setState((current) => ({
      ...current,
      experiences: current.experiences.filter((item) => item.id !== id),
    }));
    if (editingId === id) {
      resetDraft();
    }
  };

  return {
    profile,
    draft,
    editingId,
    sortedExperiences,
    activeProfileId: activeProfileIdResolved,
    profileCompletion,
    isProfileLoading,
    userDisplayName,
    initials,
    handleProfileChange,
    handleDraftChange,
    resetDraft,
    onSubmitExperience,
    onEditExperience,
    onDeleteExperience,
  };
};
