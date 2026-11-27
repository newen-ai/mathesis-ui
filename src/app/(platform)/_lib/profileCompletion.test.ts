import { describe, expect, it } from "vitest";
import { emptyProfile } from "./constants";
import { computeProfileCompletion } from "./profileCompletion";
import type { Profile } from "./types";

const full: Profile = {
  ...emptyProfile,
  nombre: "Ana",
  apellido: "Paz",
  fechaNacimiento: "1990-05-17",
  nacionalidad: "AR",
  puesto: "Matemática",
  empresaActual: "Acme",
  about: "Sobre mí",
  locationCountry: "AR",
  locationCity: "Córdoba",
  intereses: ["lógica"],
  imagenPerfilUrl: "https://example.com/a.png",
  imagenBannerUrl: "https://example.com/b.png",
};

describe("computeProfileCompletion", () => {
  it("is 0 for an empty profile", () => {
    expect(computeProfileCompletion(emptyProfile, { experiences: 0, educations: 0 })).toBe(0);
  });

  it("is 100 when every section is filled, without requiring a postal code", () => {
    expect(computeProfileCompletion(full, { experiences: 1, educations: 1 })).toBe(100);
  });

  it("counts experience, education and interests", () => {
    const withoutLists = computeProfileCompletion({ ...full, intereses: [] }, { experiences: 0, educations: 0 });
    expect(withoutLists).toBe(Math.round((9 / 12) * 100));
  });

  it("ignores whitespace-only values", () => {
    expect(computeProfileCompletion({ ...emptyProfile, about: "   ", intereses: ["  "] }, { experiences: 0, educations: 0 })).toBe(0);
  });
});
