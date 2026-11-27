import "@/lib/i18n";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
// The page frame (top bar, footer) is not what these tests are about.
vi.mock("../_components/ModulePage", () => ({
  ModulePage: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

const authApi = vi.hoisted(() => ({ getSessionAccessDecision: vi.fn() }));
vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  ...authApi,
}));

const adminApi = vi.hoisted(() => ({
  getWhitelistUsers: vi.fn(),
  getWhitelistedEmails: vi.fn(),
  promoteUserToWhitelist: vi.fn(),
  getCompaniesAdmins: vi.fn(),
}));
vi.mock("@/lib/api/admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/admin")>()),
  ...adminApi,
}));

import AdminPage from "./page";

const pendingAna = {
  id: "u1",
  email: "ana@example.com",
  canonicalEmail: "ana@example.com",
  role: "user",
  createdAt: "2026-11-27T12:00:00.000Z",
  isWhitelisted: false,
  firstName: "Ana",
  lastName: "Paz",
  hasVerifiedEmail: true,
};
const pendingAdmin = { ...pendingAna, id: "a1", email: "admin@example.com", role: "admin", firstName: "Admin" };

beforeEach(() => {
  Object.values(adminApi).forEach((mock) => mock.mockReset());
  authApi.getSessionAccessDecision.mockResolvedValue({
    sessionState: "authenticated",
    role: "admin",
    isWhitelisted: true,
    hasVerifiedEmail: true,
    hasCompletedWelcomeOnboarding: true,
  });
  adminApi.getWhitelistedEmails.mockResolvedValue([]);
  adminApi.getCompaniesAdmins.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminPage whitelist", () => {
  it("adds a pending user to the whitelist after confirming", async () => {
    const user = userEvent.setup();
    adminApi.getWhitelistUsers.mockResolvedValueOnce([pendingAna, pendingAdmin]).mockResolvedValue([]);
    adminApi.promoteUserToWhitelist.mockResolvedValue({ success: true, message: "USER_PROMOTED_TO_WHITELIST" });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<AdminPage />);

    const row = (await screen.findByText("Ana Paz")).closest("div.rounded-2xl") as HTMLElement;
    expect(within(row).getByText("ana@example.com")).toBeTruthy();
    // Admins never need the whitelist, so they are not listed as pending.
    expect(screen.queryByText("admin@example.com")).toBeNull();
    // The old request flow is gone.
    expect(screen.queryByRole("button", { name: /Solicitudes/ })).toBeNull();

    await user.click(within(row).getByRole("button", { name: "Agregar a la whitelist" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("ana@example.com"));
    expect(adminApi.promoteUserToWhitelist).toHaveBeenCalledWith("u1", expect.any(String));
    expect(await screen.findByText("Ana Paz (ana@example.com) ya está en la whitelist.")).toBeTruthy();
    expect(await screen.findByText("No hay usuarios pendientes.")).toBeTruthy();
  });

  it("does nothing when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    adminApi.getWhitelistUsers.mockResolvedValue([pendingAna]);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<AdminPage />);
    await user.click(await screen.findByRole("button", { name: "Agregar a la whitelist" }));

    expect(adminApi.promoteUserToWhitelist).not.toHaveBeenCalled();
  });

  it("shows the backend error when the approval fails", async () => {
    const user = userEvent.setup();
    adminApi.getWhitelistUsers.mockResolvedValue([pendingAna]);
    adminApi.promoteUserToWhitelist.mockResolvedValue({ success: false, message: "User not found" });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<AdminPage />);
    await user.click(await screen.findByRole("button", { name: "Agregar a la whitelist" }));

    expect(await screen.findByText("User not found")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agregar a la whitelist" })).toBeTruthy();
  });
});
