import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileOutput } from "@/lib/api/profile";
import { mockFetch } from "@/test/fetch-mock";

const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

const api = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  getProfileByUserId: vi.fn(),
  getMyProfileIdentity: vi.fn(),
  saveMyProfile: vi.fn(),
  patchWorkExperiences: vi.fn(),
  patchEducationHistory: vi.fn(),
}));

vi.mock("@/lib/api/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/profile")>();
  return { ...actual, ...api };
});

import { ProfileHttpError } from "@/lib/api/profile";
import { useProfessionalProfile } from "./useProfessionalProfile";

function remoteProfile(overrides: Partial<ProfileOutput> = {}): ProfileOutput {
  return {
    firstName: "Ana",
    lastName: "Paz",
    dateOfBirth: "1990-05-17T00:00:00.000Z",
    nationality: "AR",
    currentJobTitle: "Matemática",
    currentCompany: null,
    about: "Sobre mí",
    locationCountry: null,
    locationCity: "Córdoba",
    locationPostalCode: null,
    interests: ["lógica"],
    profileImageUrl: null,
    profileBannerImageUrl: null,
    badges: [{ slug: "mensa-argentina" }],
    employmentHistory: [
      { id: "w1", company: "Acme", jobTitle: "Dev", description: null, startYearMonth: "2018-01", endYearMonth: "2019-12" },
      { id: "w2", company: "Globex", jobTitle: "Lead", description: "Actual", startYearMonth: "2020-03", endYearMonth: null },
    ],
    educationHistory: [
      { id: "e1", institution: "UNC", degree: "Lic.", fieldOfStudy: null, startYearMonth: "2010-03", endYearMonth: "2015-12", description: null },
    ],
    ...overrides,
  } as unknown as ProfileOutput;
}

beforeEach(() => {
  for (const key of Array.from(searchParams.keys())) searchParams.delete(key);
  Object.values(api).forEach((mock) => mock.mockReset());
  api.getMyProfile.mockResolvedValue(remoteProfile());
  api.getProfileByUserId.mockResolvedValue(remoteProfile({ firstName: "Otra" }));
  api.getMyProfileIdentity.mockResolvedValue("me");
});

async function renderLoaded() {
  const hook = renderHook(() => useProfessionalProfile());
  await waitFor(() => expect(hook.result.current.isProfileLoading).toBe(false));
  return hook;
}

describe("useProfessionalProfile", () => {
  it("maps the backend profile into the editable shape", async () => {
    const { result } = await renderLoaded();

    expect(result.current.profile).toMatchObject({
      nombre: "Ana",
      apellido: "Paz",
      fechaNacimiento: "1990-05-17",
      puesto: "Matemática",
      empresaActual: "",
      intereses: ["lógica"],
    });
    expect(result.current.badges).toEqual(["mensa-argentina"]);
    expect(result.current.userDisplayName).toBe("Ana Paz");
    expect(result.current.canEditProfile).toBe(true);
    expect(result.current.isViewingOwnProfileAsMember).toBe(false);
    // 7 of 12 fields filled: nombre, apellido, fecha, nacionalidad, puesto, about, ciudad.
    expect(result.current.profileCompletion).toBe(Math.round((7 / 12) * 100));
  });

  it("sorts experiences and educations newest first and flags current ones", async () => {
    const { result } = await renderLoaded();

    expect(result.current.sortedExperiences.map((item) => item.id)).toEqual(["w2", "w1"]);
    expect(result.current.sortedExperiences[0]).toMatchObject({ trabajoActual: true, fechaFinalizacion: "" });
    expect(result.current.sortedEducations[0]).toMatchObject({ estudiandoActualmente: false, campoEstudio: "" });
  });

  it("detects viewing the own profile as a member", async () => {
    searchParams.set("userId", "me");

    const { result } = await renderLoaded();

    expect(api.getProfileByUserId).toHaveBeenCalledWith("me", expect.anything());
    expect(result.current.canEditProfile).toBe(false);
    expect(result.current.isViewingOwnProfileAsMember).toBe(true);
  });

  it("views another member's profile read-only", async () => {
    searchParams.set("userId", "other");

    const { result } = await renderLoaded();

    expect(result.current.profile.nombre).toBe("Otra");
    expect(result.current.isViewingOwnProfileAsMember).toBe(false);
  });

  it("marks blocked or missing members as unavailable", async () => {
    searchParams.set("userId", "blocked");
    api.getProfileByUserId.mockRejectedValue(new ProfileHttpError(403));

    const { result } = await renderLoaded();

    expect(result.current.isProfileUnavailable).toBe(true);
    expect(result.current.profile.nombre).toBe("");
  });

  it("asks for initialization when the own profile does not exist yet", async () => {
    // Produce the real ProfileSourceEmptyError from the actual client with a mocked 404.
    mockFetch({ status: 404, body: {} });
    const actual = await vi.importActual<typeof import("@/lib/api/profile")>("@/lib/api/profile");
    const emptyError = await actual.getMyProfile().catch((error: unknown) => error);
    api.getMyProfile.mockRejectedValue(emptyError);

    const { result } = await renderLoaded();

    expect(result.current.needsProfileInitialization).toBe(true);
    expect(result.current.isProfileUnavailable).toBe(false);
  });

  it("saves the profile with trimmed fields and the current histories", async () => {
    api.saveMyProfile.mockResolvedValue({ success: true, message: "OK" });
    const { result } = await renderLoaded();

    let outcome: { ok: boolean; message?: string } | undefined;
    await act(async () => {
      outcome = await result.current.onSaveProfile({ ...result.current.profile, nombre: "  Ana María ", puesto: "  " });
    });

    expect(outcome).toEqual({ ok: true });
    const payload = api.saveMyProfile.mock.calls[0][0];
    expect(payload).toMatchObject({ firstName: "Ana María", dateOfBirth: "1990-05-17T00:00:00.000Z", interests: ["lógica"] });
    expect(payload).not.toHaveProperty("currentJobTitle");
    expect(payload.employmentHistory).toEqual([
      { company: "Acme", jobTitle: "Dev", description: "", startYearMonth: "2018-01", endYearMonth: "2019-12" },
      { company: "Globex", jobTitle: "Lead", description: "Actual", startYearMonth: "2020-03" },
    ]);
    expect(payload.educationHistory).toEqual([{ institution: "UNC", degree: "Lic.", startYearMonth: "2010-03", endYearMonth: "2015-12" }]);
    expect(api.getMyProfile).toHaveBeenCalledTimes(2);
  });

  it("reports profile save and refresh failures", async () => {
    const { result } = await renderLoaded();

    api.saveMyProfile.mockResolvedValue({ success: false, message: "Validation failed" });
    await act(async () => {
      expect(await result.current.onSaveProfile(result.current.profile)).toEqual({ ok: false, message: "Validation failed" });
    });
    expect(result.current.profileSaveError).toBe("Validation failed");

    act(() => result.current.clearProfileSaveError());
    expect(result.current.profileSaveError).toBeNull();

    api.saveMyProfile.mockResolvedValue({ success: true, message: "OK" });
    api.getMyProfile.mockRejectedValue(new Error("network"));
    await act(async () => {
      expect(await result.current.onSaveProfile(result.current.profile)).toEqual({ ok: false, message: "Profile was saved but refresh failed" });
    });
  });

  it("returns the backend message when experience or education operations fail (no stale state)", async () => {
    const { result } = await renderLoaded();

    api.patchWorkExperiences.mockResolvedValue({ success: false, message: "Work experience not found" });
    api.patchEducationHistory.mockResolvedValue({ success: false, message: "Education experience not found" });

    await act(async () => {
      expect(await result.current.onSaveExperienceOperations([{ action: "REMOVE", id: "nope" }])).toEqual({
        ok: false,
        message: "Work experience not found",
      });
      expect(await result.current.onSaveEducationOperations([{ action: "REMOVE", id: "nope" }])).toEqual({
        ok: false,
        message: "Education experience not found",
      });
    });

    expect(result.current.experienceSaveError).toBe("Work experience not found");
    expect(result.current.educationSaveError).toBe("Education experience not found");

    act(() => {
      result.current.clearExperienceSaveError();
      result.current.clearEducationSaveError();
    });
    expect(result.current.experienceSaveError).toBeNull();
  });

  it("saves operations, refreshes, and skips empty batches", async () => {
    const { result } = await renderLoaded();
    api.patchWorkExperiences.mockResolvedValue({ success: true, message: "OK" });
    api.patchEducationHistory.mockResolvedValue({ success: true, message: "OK" });

    await act(async () => {
      expect(await result.current.onSaveExperienceOperations([])).toEqual({ ok: true });
      expect(await result.current.onSaveEducationOperations([])).toEqual({ ok: true });
      expect(await result.current.onSaveExperienceOperations([{ action: "REMOVE", id: "w1" }])).toEqual({ ok: true });
      expect(await result.current.onSaveEducationOperations([{ action: "REMOVE", id: "e1" }])).toEqual({ ok: true });
    });

    expect(api.patchWorkExperiences).toHaveBeenCalledTimes(1);
    expect(api.patchEducationHistory).toHaveBeenCalledTimes(1);

    api.getMyProfile.mockRejectedValue(new Error("network"));
    await act(async () => {
      expect((await result.current.onSaveExperienceOperations([{ action: "REMOVE", id: "w1" }])).message).toBe(
        "Experience was saved but refresh failed"
      );
      expect((await result.current.onSaveEducationOperations([{ action: "REMOVE", id: "e1" }])).message).toBe(
        "Education was saved but refresh failed"
      );
    });
  });

  it("refetches on demand and swallows errors into state", async () => {
    const { result } = await renderLoaded();
    api.getMyProfile.mockResolvedValue(remoteProfile({ firstName: "Nueva" }));

    await act(async () => {
      await result.current.refetchProfile();
    });
    expect(result.current.profile.nombre).toBe("Nueva");

    api.getMyProfile.mockRejectedValue(new Error("network"));
    await act(async () => {
      await result.current.refetchProfile();
    });
    expect(result.current.profile.nombre).toBe("");
  });
});
