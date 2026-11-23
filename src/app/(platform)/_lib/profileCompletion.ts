import type { Profile } from "./types";

const hasText = (value: string) => value.trim().length > 0;

/**
 * Profile completion as a 0-100 percentage. Each check weighs the same and stands for one
 * visible part of the profile, so the bar moves when the user fills in what they actually see.
 */
export function computeProfileCompletion(
  profile: Profile,
  counts: { experiences: number; educations: number }
): number {
  const checks = [
    hasText(profile.nombre) && hasText(profile.apellido),
    hasText(profile.imagenPerfilUrl),
    hasText(profile.imagenBannerUrl),
    hasText(profile.puesto),
    hasText(profile.empresaActual),
    hasText(profile.locationCountry) && hasText(profile.locationCity),
    hasText(profile.fechaNacimiento),
    hasText(profile.nacionalidad),
    hasText(profile.about),
    counts.experiences > 0,
    counts.educations > 0,
    profile.intereses.some(hasText),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
