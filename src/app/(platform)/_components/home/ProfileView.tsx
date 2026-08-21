"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  navItems,
} from "../../_lib/constants";
import { useProfessionalProfile } from "../../_lib/hooks/useProfessionalProfile";
import type { Profile } from "../../_lib/types";
import { formatBadgeSlug } from "@/lib/utils/badge";
import { TopBar } from "../TopBar";
import { EducationCard } from "./EducationCard";
import { ExperienceCard } from "./ExperienceCard";
import { InteresesCard } from "./InteresesCard";
import { ProfileFormCard } from "./ProfileFormCard";
import { ProfileInitializationView } from "./ProfileInitializationView";

const AVATAR_PREVIEW_SIZE = 220;
const AVATAR_EXPORT_SIZE = 512;

type AvatarEditorState = {
  sourceDataUrl: string;
  scale: number;
  offsetX: number;
  offsetY: number;
};

type BannerEditorState = {
  sourceDataUrl: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  targetWidth: number;
  targetHeight: number;
};

type TouchGestureState =
  | {
      mode: "drag";
      startX: number;
      startY: number;
      startOffsetX: number;
      startOffsetY: number;
    }
  | {
      mode: "pinch";
      startDistance: number;
      startScale: number;
    };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    image.src = src;
  });
}

function getTouchDistance(
  first: { clientX: number; clientY: number },
  second: { clientX: number; clientY: number }
) {
  const deltaX = second.clientX - first.clientX;
  const deltaY = second.clientY - first.clientY;
  return Math.hypot(deltaX, deltaY);
}

async function renderAvatarFromEditor(state: AvatarEditorState): Promise<string> {
  const image = await loadImage(state.sourceDataUrl);
  const previewSize = AVATAR_PREVIEW_SIZE;
  const exportSize = AVATAR_EXPORT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = exportSize;
  canvas.height = exportSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar el lienzo de imagen");
  }

  const imageRatio = image.width / image.height;
  const baseWidth = imageRatio >= 1 ? previewSize * imageRatio : previewSize;
  const baseHeight = imageRatio >= 1 ? previewSize : previewSize / imageRatio;
  const drawWidth = baseWidth * state.scale;
  const drawHeight = baseHeight * state.scale;
  const drawLeft = previewSize / 2 - drawWidth / 2 + state.offsetX;
  const drawTop = previewSize / 2 - drawHeight / 2 + state.offsetY;
  const factor = exportSize / previewSize;

  context.fillStyle = "#102e4b";
  context.fillRect(0, 0, exportSize, exportSize);
  context.drawImage(
    image,
    drawLeft * factor,
    drawTop * factor,
    drawWidth * factor,
    drawHeight * factor
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderBannerFromEditor(
  state: BannerEditorState,
  previewWidth: number,
  previewHeight: number,
  outputWidth: number,
  outputHeight: number
): Promise<string> {
  const image = await loadImage(state.sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar el lienzo de banner");
  }

  const imageRatio = image.width / image.height;
  const previewRatio = previewWidth / previewHeight;
  const baseWidth = imageRatio >= previewRatio ? previewWidth : previewHeight * imageRatio;
  const baseHeight = imageRatio >= previewRatio ? previewWidth / imageRatio : previewHeight;
  const drawWidth = baseWidth * state.scale;
  const drawHeight = baseHeight * state.scale;
  const drawLeft = previewWidth / 2 - drawWidth / 2 + state.offsetX;
  const drawTop = previewHeight / 2 - drawHeight / 2 + state.offsetY;
  const factorX = outputWidth / previewWidth;
  const factorY = outputHeight / previewHeight;

  context.fillStyle = "#173A5C";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(
    image,
    drawLeft * factorX,
    drawTop * factorY,
    drawWidth * factorX,
    drawHeight * factorY
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

function buildHeadline(puesto: string, empresa: string, city: string) {
  const firstPart = [puesto, empresa].filter((item) => item.trim().length > 0).join(" · ");
  if (!firstPart && !city) {
    return "Completa tu titular profesional";
  }
  if (!city) {
    return firstPart;
  }
  if (!firstPart) {
    return city;
  }
  return `${firstPart} · ${city}`;
}

export function ProfileView() {
  const router = useRouter();
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerDisplayRef = useRef<HTMLDivElement | null>(null);
  const bannerPreviewRef = useRef<HTMLDivElement | null>(null);
  const [activeEditSection, setActiveEditSection] = useState<"profile" | "experience" | "education" | "interests" | null>(null);
  const [editSessionId, setEditSessionId] = useState(0);
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditorState | null>(null);
  const [bannerEditor, setBannerEditor] = useState<BannerEditorState | null>(null);
  const [headerImageError, setHeaderImageError] = useState<string | null>(null);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const bannerDragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const avatarTouchRef = useRef<TouchGestureState | null>(null);
  const bannerTouchRef = useRef<TouchGestureState | null>(null);

  const {
    profile,
    sortedExperiences,
    sortedEducations,
    currentUserId,
    canEditProfile,
    profileCompletion,
    isProfileLoading,
    isSavingProfile,
    profileSaveError,
    needsProfileInitialization,
    isSavingExperiences,
    experienceSaveError,
    isSavingEducations,
    educationSaveError,
    userDisplayName,
    initials,
    badges,
    onSaveProfile,
    onSaveExperienceOperations,
    onSaveEducationOperations,
    clearProfileSaveError,
    clearExperienceSaveError,
    clearEducationSaveError,
  } = useProfessionalProfile();

  const headline = buildHeadline(
    profile.puesto,
    profile.empresaActual,
    profile.locationCity
  );

  const onStartSectionEdit = (section: "profile" | "experience" | "education" | "interests") => {
    setEditSessionId((current) => current + 1);
    setActiveEditSection(section);
  };

  const onCloseSectionEdit = () => {
    setActiveEditSection(null);
  };

  const saveHeaderImageProfile = async (nextProfile: Profile) => {
    setHeaderImageError(null);
    const result = await onSaveProfile(nextProfile);
    if (!result.ok) {
      setHeaderImageError(result.message ?? "No se pudo guardar la imagen");
    }
  };

  const onBannerFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setHeaderImageError("Selecciona un archivo de imagen valido para el banner.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const bannerRect = bannerDisplayRef.current?.getBoundingClientRect();
      const targetWidth = Math.max(1, Math.round(bannerRect?.width ?? 1280));
      const targetHeight = Math.max(1, Math.round(bannerRect?.height ?? 208));
      setBannerEditor({
        sourceDataUrl: dataUrl,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        targetWidth,
        targetHeight,
      });
      setHeaderImageError(null);
    } catch {
      setHeaderImageError("No se pudo procesar la imagen del banner.");
    }
  };

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setHeaderImageError("Selecciona un archivo de imagen valido para el perfil.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarEditor({
        sourceDataUrl: dataUrl,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
      setHeaderImageError(null);
    } catch {
      setHeaderImageError("No se pudo procesar la imagen de perfil.");
    }
  };

  const onConfirmAvatarEditor = async () => {
    if (!avatarEditor) return;

    try {
      const finalAvatar = await renderAvatarFromEditor(avatarEditor);
      await saveHeaderImageProfile({
        ...profile,
        imagenPerfilUrl: finalAvatar,
      });
      setAvatarEditor(null);
    } catch {
      setHeaderImageError("No se pudo preparar la imagen de perfil.");
    }
  };

  const onAvatarTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!avatarEditor) return;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      avatarTouchRef.current = {
        mode: "drag",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: avatarEditor.offsetX,
        startOffsetY: avatarEditor.offsetY,
      };
      return;
    }

    if (event.touches.length === 2) {
      avatarTouchRef.current = {
        mode: "pinch",
        startDistance: getTouchDistance(event.touches[0], event.touches[1]),
        startScale: avatarEditor.scale,
      };
    }
  };

  const onAvatarTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = avatarTouchRef.current;
    if (!gesture || !avatarEditor) return;

    event.preventDefault();

    if (gesture.mode === "drag" && event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      setAvatarEditor((current) =>
        current
          ? {
              ...current,
              offsetX: gesture.startOffsetX + deltaX,
              offsetY: gesture.startOffsetY + deltaY,
            }
          : current
      );
      return;
    }

    if (gesture.mode === "pinch" && event.touches.length === 2) {
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const nextScale = Math.min(3, Math.max(1, Number((gesture.startScale * (currentDistance / gesture.startDistance)).toFixed(2))));
      setAvatarEditor((current) =>
        current
          ? {
              ...current,
              scale: nextScale,
            }
          : current
      );
    }
  };

  const onAvatarTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!avatarEditor) return;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      avatarTouchRef.current = {
        mode: "drag",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: avatarEditor.offsetX,
        startOffsetY: avatarEditor.offsetY,
      };
      return;
    }

    if (event.touches.length === 0) {
      avatarTouchRef.current = null;
    }
  };

  const onBannerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!bannerEditor) return;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      bannerTouchRef.current = {
        mode: "drag",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: bannerEditor.offsetX,
        startOffsetY: bannerEditor.offsetY,
      };
      return;
    }

    if (event.touches.length === 2) {
      bannerTouchRef.current = {
        mode: "pinch",
        startDistance: getTouchDistance(event.touches[0], event.touches[1]),
        startScale: bannerEditor.scale,
      };
    }
  };

  const onBannerTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = bannerTouchRef.current;
    if (!gesture || !bannerEditor) return;

    event.preventDefault();

    if (gesture.mode === "drag" && event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      setBannerEditor((current) =>
        current
          ? {
              ...current,
              offsetX: gesture.startOffsetX + deltaX,
              offsetY: gesture.startOffsetY + deltaY,
            }
          : current
      );
      return;
    }

    if (gesture.mode === "pinch" && event.touches.length === 2) {
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const nextScale = Math.min(3, Math.max(1, Number((gesture.startScale * (currentDistance / gesture.startDistance)).toFixed(2))));
      setBannerEditor((current) =>
        current
          ? {
              ...current,
              scale: nextScale,
            }
          : current
      );
    }
  };

  const onBannerTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!bannerEditor) return;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      bannerTouchRef.current = {
        mode: "drag",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: bannerEditor.offsetX,
        startOffsetY: bannerEditor.offsetY,
      };
      return;
    }

    if (event.touches.length === 0) {
      bannerTouchRef.current = null;
    }
  };

  const onConfirmBannerEditor = async () => {
    if (!bannerEditor) return;

    try {
      const previewRect = bannerPreviewRef.current?.getBoundingClientRect();
      const previewWidth = previewRect?.width ?? bannerEditor.targetWidth;
      const previewHeight = previewRect?.height ?? bannerEditor.targetHeight;
      const outputWidth = Math.min(3840, Math.max(960, bannerEditor.targetWidth * 3));
      const outputHeight = Math.min(2160, Math.max(320, bannerEditor.targetHeight * 3));
      const finalBanner = await renderBannerFromEditor(
        bannerEditor,
        previewWidth,
        previewHeight,
        outputWidth,
        outputHeight
      );
      await saveHeaderImageProfile({
        ...profile,
        imagenBannerUrl: finalBanner,
      });
      setBannerEditor(null);
    } catch {
      setHeaderImageError("No se pudo preparar la imagen del banner.");
    }
  };

  useEffect(() => {
    if (!isDraggingAvatar) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;

      setAvatarEditor((current) =>
        current
          ? {
              ...current,
              offsetX: start.startOffsetX + deltaX,
              offsetY: start.startOffsetY + deltaY,
            }
          : current
      );
    };

    const onMouseUp = () => {
      setIsDraggingAvatar(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingAvatar]);

  useEffect(() => {
    if (!isDraggingBanner) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const start = bannerDragStartRef.current;
      if (!start) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;

      setBannerEditor((current) =>
        current
          ? {
              ...current,
              offsetX: start.startOffsetX + deltaX,
              offsetY: start.startOffsetY + deltaY,
            }
          : current
      );
    };

    const onMouseUp = () => {
      setIsDraggingBanner(false);
      bannerDragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingBanner]);

  if (needsProfileInitialization) {
    return (
      <ProfileInitializationView
        isSaving={isSavingProfile}
        saveError={profileSaveError}
        onSave={onSaveProfile}
        onClearSaveError={clearProfileSaveError}
      />
    );
  }

  return (
    <div className="mathesis-shell min-h-screen">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-7xl space-y-3 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <section className="mathesis-card overflow-hidden">
          <div className="group relative">
            <div
              ref={bannerDisplayRef}
              className={`h-36 sm:h-52 ${profile.imagenBannerUrl.trim() ? "" : "bg-[linear-gradient(135deg,#0e2d4d,#21476e)]"}`}
              style={
                profile.imagenBannerUrl.trim()
                  ? {
                      backgroundImage: `url(${profile.imagenBannerUrl.trim()})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            />
            {canEditProfile ? (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isSavingProfile}
                className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition hover:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed"
                aria-label="Cambiar imagen de banner"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/35 px-4 py-2 text-sm font-semibold">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Cambiar banner
                </span>
              </button>
            ) : null}
          </div>
          <div className="relative px-4 pb-3 pt-3 sm:px-7 sm:pb-4 sm:pt-4">
            <div className="group absolute -top-10 left-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#102e4b] text-[1.5rem] font-semibold text-[var(--brand-500)] sm:-top-14 sm:left-7 sm:h-28 sm:w-28 sm:border-[6px] sm:text-[2rem]">
              {profile.imagenPerfilUrl.trim() ? (
                <div
                  role="img"
                  aria-label={`Foto de perfil de ${userDisplayName}`}
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${profile.imagenPerfilUrl.trim()})` }}
                />
              ) : (
                initials || "M"
              )}
              {canEditProfile ? (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isSavingProfile}
                  className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition hover:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed"
                  aria-label="Cambiar imagen de perfil"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </button>
              ) : null}
            </div>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-2 sm:mt-14 sm:gap-3">
              <div>
                <h1 className="font-[family-name:var(--font-spectral)] text-[1.05rem] font-semibold leading-tight text-[var(--navy-900)] sm:text-[1.3rem]">
                  {userDisplayName}
                </h1>
                {badges.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {badges.map((slug, index) => (
                      <div
                        key={`${slug}-${index}`}
                        className="inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--brand-50)] px-[0.55rem] py-[0.22rem] text-[0.56rem] font-semibold text-[var(--brand-700)]"
                      >
                        {`∫ ${formatBadgeSlug(slug)}`}
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="mt-1.5 text-[0.72rem] text-[var(--text-primary)] sm:mt-2 sm:text-[0.85rem]">{headline}</p>
              </div>

              {canEditProfile ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUserId) {
                        return;
                      }

                      router.push(`/perfil?userId=${encodeURIComponent(currentUserId)}`);
                    }}
                    disabled={!currentUserId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-500)] px-3 py-[0.34rem] text-[0.62rem] font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)] disabled:cursor-not-allowed disabled:opacity-70 sm:gap-2 sm:px-4 sm:py-[0.38rem] sm:text-[0.65rem]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[0.86rem] w-[0.86rem] sm:h-[0.95rem] sm:w-[0.95rem]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver perfil
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[2rem] w-[2rem] items-center justify-center rounded-[0.5rem] border border-[var(--line)] text-[1rem] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] sm:h-[2.4rem] sm:w-[2.4rem] sm:rounded-[0.55rem] sm:text-[1.1rem]"
                    aria-label="Mas opciones"
                  >
                    ···
                  </button>
                </div>
              ) : null}
            </div>

            {headerImageError ? (
              <p className="mt-2 max-w-xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {headerImageError}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mathesis-fade-up-delay mathesis-profile-stack space-y-2">
          <ProfileFormCard
            key={`profile-form-${editSessionId}`}
            profile={profile}
            canEdit={canEditProfile}
            isEditingMode={activeEditSection === "profile"}
            profileCompletion={profileCompletion}
            isLoading={isProfileLoading}
            isSaving={isSavingProfile}
            saveError={profileSaveError}
            onSave={onSaveProfile}
            onClearSaveError={clearProfileSaveError}
            onStartEditing={() => onStartSectionEdit("profile")}
            onCloseEditing={onCloseSectionEdit}
          />
          <ExperienceCard
            key={`experience-${editSessionId}`}
            experiences={sortedExperiences}
            canEdit={canEditProfile}
            isEditingMode={activeEditSection === "experience"}
            defaultLocation={profile.locationCity}
            isSaving={isSavingExperiences}
            saveError={experienceSaveError}
            onSaveOperations={onSaveExperienceOperations}
            onClearSaveError={clearExperienceSaveError}
            onStartEditing={() => onStartSectionEdit("experience")}
            onCloseEditing={onCloseSectionEdit}
          />
          <EducationCard
            key={`education-${editSessionId}`}
            educations={sortedEducations}
            canEdit={canEditProfile}
            isEditingMode={activeEditSection === "education"}
            isSaving={isSavingEducations}
            saveError={educationSaveError}
            onSaveOperations={onSaveEducationOperations}
            onClearSaveError={clearEducationSaveError}
            onStartEditing={() => onStartSectionEdit("education")}
            onCloseEditing={onCloseSectionEdit}
          />
          <InteresesCard
            key={`interests-${editSessionId}`}
            profile={profile}
            canEdit={canEditProfile}
            isEditingMode={activeEditSection === "interests"}
            isSaving={isSavingProfile || isSavingExperiences || isSavingEducations}
            saveError={profileSaveError}
            onSave={onSaveProfile}
            onClearSaveError={clearProfileSaveError}
            onStartEditing={() => onStartSectionEdit("interests")}
            onCloseEditing={onCloseSectionEdit}
          />
        </section>

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onBannerFileChange}
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarFileChange}
        />
      </main>

      {bannerEditor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--navy-900)]">
              Ajustar imagen de banner
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Arrastra para mover y usa la rueda del mouse para acercar o alejar. Esta vista muestra lo que se vera en tu encabezado.
            </p>

            <div className="mt-4 flex justify-center">
              <div
                ref={bannerPreviewRef}
                className="relative w-full max-w-[900px] overflow-hidden rounded-xl border border-[var(--line)] bg-[#173A5C]"
                style={{
                  touchAction: "none",
                  aspectRatio: `${bannerEditor.targetWidth} / ${bannerEditor.targetHeight}`,
                }}
                onMouseDown={(event) => {
                  if (!bannerEditor) {
                    return;
                  }

                  event.preventDefault();
                  bannerDragStartRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    startOffsetX: bannerEditor.offsetX,
                    startOffsetY: bannerEditor.offsetY,
                  };
                  setIsDraggingBanner(true);
                }}
                onTouchStart={onBannerTouchStart}
                onTouchMove={onBannerTouchMove}
                onTouchEnd={onBannerTouchEnd}
                onWheel={(event) => {
                  event.preventDefault();
                  const step = event.deltaY > 0 ? -0.08 : 0.08;

                  setBannerEditor((current) => {
                    if (!current) {
                      return current;
                    }

                    const nextScale = Math.min(3, Math.max(1, Number((current.scale + step).toFixed(2))));
                    return {
                      ...current,
                      scale: nextScale,
                    };
                  });
                }}
              >
                <div
                  role="img"
                  aria-label="Previsualizacion de banner"
                  className={`absolute left-1/2 top-1/2 h-full w-full bg-contain bg-center bg-no-repeat ${isDraggingBanner ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{
                    backgroundImage: `url(${bannerEditor.sourceDataUrl})`,
                    transform: `translate(calc(-50% + ${bannerEditor.offsetX}px), calc(-50% + ${bannerEditor.offsetY}px)) scale(${bannerEditor.scale})`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
              Tip: mueve el banner hasta alinear la zona importante. El resto quedara fuera del area visible.
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConfirmBannerEditor}
                disabled={isSavingProfile}
                className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingProfile ? "Guardando..." : "Guardar banner"}
              </button>
              <button
                type="button"
                onClick={() => setBannerEditor(null)}
                disabled={isSavingProfile}
                className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {avatarEditor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--navy-900)]">
              Ajustar foto de perfil
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Mueve y ajusta la imagen para previsualizar exactamente lo que se vera en el circulo.
            </p>

            <div className="mt-4 flex justify-center">
              <div
                className="relative h-[220px] w-[220px] overflow-hidden rounded-full border-4 border-white bg-[#102e4b] shadow-[0_0_0_1px_rgba(15,23,42,0.15)]"
                style={{ touchAction: "none" }}
                onMouseDown={(event) => {
                  if (!avatarEditor) {
                    return;
                  }

                  event.preventDefault();
                  dragStartRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    startOffsetX: avatarEditor.offsetX,
                    startOffsetY: avatarEditor.offsetY,
                  };
                  setIsDraggingAvatar(true);
                }}
                onTouchStart={onAvatarTouchStart}
                onTouchMove={onAvatarTouchMove}
                onTouchEnd={onAvatarTouchEnd}
                onWheel={(event) => {
                  event.preventDefault();
                  const step = event.deltaY > 0 ? -0.08 : 0.08;

                  setAvatarEditor((current) => {
                    if (!current) {
                      return current;
                    }

                    const nextScale = Math.min(3, Math.max(1, Number((current.scale + step).toFixed(2))));
                    return {
                      ...current,
                      scale: nextScale,
                    };
                  });
                }}
              >
                <div
                  role="img"
                  aria-label="Previsualizacion de perfil"
                  className={`absolute left-1/2 top-1/2 h-full w-full bg-cover bg-center ${isDraggingAvatar ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{
                    backgroundImage: `url(${avatarEditor.sourceDataUrl})`,
                    transform: `translate(calc(-50% + ${avatarEditor.offsetX}px), calc(-50% + ${avatarEditor.offsetY}px)) scale(${avatarEditor.scale})`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
              Arrastra la imagen con el mouse para posicionarla. Usa la rueda del mouse para acercar o alejar.
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConfirmAvatarEditor}
                disabled={isSavingProfile}
                className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingProfile ? "Guardando..." : "Guardar imagen"}
              </button>
              <button
                type="button"
                onClick={() => setAvatarEditor(null)}
                disabled={isSavingProfile}
                className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
