import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/login";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const authApi = vi.hoisted(() => ({ getSessionState: vi.fn() }));
vi.mock("@/lib/api/auth", () => authApi);

const profileApi = vi.hoisted(() => ({ getMyPreferences: vi.fn(), updateMyPreferences: vi.fn() }));
vi.mock("@/lib/api/profile", () => profileApi);

import { useUiTheme } from "@/lib/theme/useUiTheme";
import { useRedirectIfAuthenticated } from "./useRedirectIfAuthenticated";

const replace = vi.fn();

beforeEach(() => {
  pathname = "/login";
  replace.mockReset();
  authApi.getSessionState.mockReset();
  profileApi.getMyPreferences.mockReset();
  profileApi.updateMyPreferences.mockReset();
  Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, replace } });
  window.localStorage.clear();
  document.cookie = "theme=; Max-Age=0; Path=/";
  document.documentElement.removeAttribute("data-theme");
});

describe("useRedirectIfAuthenticated", () => {
  it("redirects logged-in users away from auth pages", async () => {
    authApi.getSessionState.mockResolvedValue("authenticated");

    const { result } = renderHook(() => useRedirectIfAuthenticated("/ateneo"));

    await waitFor(() => expect(result.current).toEqual({ isChecking: false, isAuthenticated: true }));
    expect(replace).toHaveBeenCalledWith("/ateneo");
  });

  it("does not redirect when already on the destination", async () => {
    pathname = "/ateneo";
    authApi.getSessionState.mockResolvedValue("authenticated");

    const { result } = renderHook(() => useRedirectIfAuthenticated("/ateneo"));

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  it.each(["unauthenticated", "unknown"])("lets %s visitors stay", async (state) => {
    authApi.getSessionState.mockResolvedValue(state);

    const { result } = renderHook(() => useRedirectIfAuthenticated("/ateneo"));

    await waitFor(() => expect(result.current).toEqual({ isChecking: false, isAuthenticated: false }));
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("useUiTheme", () => {
  it("starts from the document theme and adopts the backend preference", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    profileApi.getMyPreferences.mockResolvedValue({ themePreference: "dark" });

    const { result } = renderHook(() => useUiTheme());
    expect(result.current.theme).toBe("light");

    await waitFor(() => expect(result.current.theme).toBe("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("keeps the local theme when the backend has none", async () => {
    window.localStorage.setItem("theme", "dark");
    profileApi.getMyPreferences.mockResolvedValue(null);

    const { result } = renderHook(() => useUiTheme());

    await waitFor(() => expect(profileApi.getMyPreferences).toHaveBeenCalled());
    expect(result.current.theme).toBe("dark");
  });

  it("toggles, persists locally and saves to the backend, even if saving fails", async () => {
    profileApi.getMyPreferences.mockResolvedValue(null);
    profileApi.updateMyPreferences.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useUiTheme());

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(profileApi.updateMyPreferences).toHaveBeenCalledWith("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    profileApi.updateMyPreferences.mockResolvedValue({ success: true, message: "OK" });
    await act(async () => {
      await result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
  });
});
