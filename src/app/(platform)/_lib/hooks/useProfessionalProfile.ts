"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { emptyExperience, emptyProfile, STORAGE_KEY } from "../constants";
import { Experience, ExperienceDraft, Profile } from "../types";
import { readSession } from "@/lib/auth/session";

const DEFAULT_PROFILE_ID = "profile-default";

type StoredProfilePayload = {
  profile?: Profile;
  experiences?: Experience[];
  activeProfileId?: string;
  profiles?: Array<{
    id?: string;
    profile?: Profile;
    experiences?: Experience[];
  }>;
};

function splitFullName(fullName: string) {
  const chunks = fullName.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) {
    return { nombre: "", apellido: "" };
  }

  if (chunks.length === 1) {
    return { nombre: chunks[0], apellido: "" };
  }

  return {
    nombre: chunks[0],
    apellido: chunks.slice(1).join(" "),
  };
}

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

function buildInitialProfileState() {
  const session = readSession();
  const { nombre: nombreSesion, apellido: apellidoSesion } = splitFullName(
    session?.user.name ?? ""
  );

  let loadedProfile: Profile = emptyProfile;
  let loadedExperiences: Experience[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredProfilePayload;

      if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
        const selected =
          parsed.profiles.find((entry) => entry.id === parsed.activeProfileId) ??
          parsed.profiles[0];

        loadedProfile = selected?.profile ?? emptyProfile;
        loadedExperiences = Array.isArray(selected?.experiences)
          ? selected.experiences
          : [];
      } else {
        loadedProfile = parsed.profile ?? emptyProfile;
        loadedExperiences = Array.isArray(parsed.experiences)
          ? parsed.experiences
          : [];
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    profile: {
      ...loadedProfile,
      nombre: nombreSesion,
      apellido: apellidoSesion,
    },
    experiences: loadedExperiences.map(normalizeExperience),
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
  const [state, setState] = useState(buildInitialProfileState);
  const [draft, setDraft] = useState<ExperienceDraft>(emptyExperience);
  const [editingId, setEditingId] = useState<string | null>(null);
  const profile = state.profile;
  const activeProfileIdResolved = state.profileId;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: state.profile,
        experiences: state.experiences,
      })
    );
  }, [state]);

  const sortedExperiences = useMemo(() => {
    return [...state.experiences].sort((a, b) => {
      const startDiff = b.fechaComienzo.localeCompare(a.fechaComienzo);
      if (startDiff !== 0) return startDiff;
      return b.fechaFinalizacion.localeCompare(a.fechaFinalizacion);
    });
  }, [state.experiences]);

  const profileCompletion = useMemo(() => {
    const totalFields = 5;
    const completed = [
      profile.nombre,
      profile.apellido,
      profile.fechaNacimiento,
      profile.nacionalidad,
      profile.puesto,
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
