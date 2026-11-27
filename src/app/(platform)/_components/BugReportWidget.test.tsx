import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/utils/bug-report", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/bug-report")>()),
  isBugReportFeatureEnabled: () => true,
}));

const getSessionContactMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  getSessionContact: getSessionContactMock,
}));

const submitBugReportMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/profile")>()),
  submitBugReport: submitBugReportMock,
}));

import { BugReportWidget } from "./BugReportWidget";

async function openAndFill() {
  render(<BugReportWidget />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir reportar bug" }));
  fireEvent.change(screen.getByPlaceholderText("Ej: El botón de guardar no responde"), { target: { value: "Falla" } });
  fireEvent.change(screen.getByPlaceholderText("Contanos qué hiciste, qué esperabas y qué terminó pasando."), {
    target: { value: "No carga" },
  });
}

const submitButton = () => screen.getByRole("button", { name: "Enviar reporte" });

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  window.localStorage.clear();
  submitBugReportMock.mockResolvedValue({ success: true, message: "BUG_REPORT_CREATED" });
});

describe("BugReportWidget", () => {
  it("asks logged-out visitors for a contact email and sends it with the detected device", async () => {
    getSessionContactMock.mockResolvedValue(null);
    await openAndFill();

    const emailInput = await screen.findByPlaceholderText("tu@email.com");
    expect(screen.getByText("Hasta 1 imagen de 2 MB sin iniciar sesión.", { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId("bug-report-device").textContent).not.toBe("");
    expect(submitButton()).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "  visita@example.com " } });
    expect(submitButton()).toBeEnabled();
    fireEvent.click(submitButton());

    await waitFor(() => expect(submitBugReportMock).toHaveBeenCalledTimes(1));
    const input = submitBugReportMock.mock.calls[0][0];
    expect(input.contactEmail).toBe("visita@example.com");
    expect(input.device).toMatchObject({ deviceType: expect.any(String) });
  });

  it("uses the account email for logged-in users without sending it", async () => {
    getSessionContactMock.mockResolvedValue({ id: "u1", email: "socio@example.com" });
    await openAndFill();

    expect(await screen.findByText("socio@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Email de contacto/ })).toBeNull();
    expect(screen.queryByPlaceholderText("tu@email.com")).toBeNull();
    fireEvent.click(submitButton());

    await waitFor(() => expect(submitBugReportMock).toHaveBeenCalledTimes(1));
    expect(submitBugReportMock.mock.calls[0][0].contactEmail).toBeUndefined();
    expect(submitBugReportMock.mock.calls[0][0].captchaToken).toBeUndefined();
  });
});
