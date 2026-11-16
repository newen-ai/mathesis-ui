import "@/lib/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const api = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  getSessionAccessDecision: vi.fn(),
  requestVerificationEmailByToken: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  ...api,
}));

import { ConfirmClient } from "./ConfirmClient";
import { clearVerifyEmailOnceCache } from "./confirm-request-cache";

const unauthenticated = {
  sessionState: "unauthenticated",
  isWhitelisted: false,
  hasVerifiedEmail: false,
  hasCompletedWelcomeOnboarding: false,
};

function failConfirmWith(code: string) {
  api.verifyEmail.mockResolvedValue({
    success: false,
    status: 400,
    message: "Invalid or expired confirmation token",
    details: { code },
  });
}

const resendButton = () => screen.queryByRole("button", { name: "Reenviar correo de verificación" });

beforeEach(() => {
  clearVerifyEmailOnceCache();
  Object.values(api).forEach((mock) => mock.mockReset());
  router.replace.mockReset();
  api.getSessionAccessDecision.mockResolvedValue(unauthenticated);
});

describe("ConfirmClient", () => {
  it("offers a one-click resend when the link expired", async () => {
    const user = userEvent.setup();
    failConfirmWith("EMAIL_VERIFICATION_TOKEN_EXPIRED");
    api.requestVerificationEmailByToken.mockResolvedValue({ success: true, message: "VERIFICATION_EMAIL_SENT" });

    render(<ConfirmClient token="old-token" />);

    expect(await screen.findByRole("heading", { name: "El enlace venció" })).toBeInTheDocument();
    await user.click(resendButton()!);

    expect(api.requestVerificationEmailByToken).toHaveBeenCalledWith("old-token");
    expect(await screen.findByText(/Te enviamos un nuevo correo de verificación/)).toBeInTheDocument();
    // The old token was replaced, so a second resend from this page would not send anything.
    expect(resendButton()).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  it("explains the cooldown when the resend is rate limited and keeps the button", async () => {
    const user = userEvent.setup();
    failConfirmWith("EMAIL_VERIFICATION_TOKEN_EXPIRED");
    api.requestVerificationEmailByToken.mockResolvedValue({
      success: false,
      status: 429,
      message: "Please wait before requesting another verification email",
      details: { code: "VERIFICATION_EMAIL_RATE_LIMITED", retryAfterSeconds: 120 },
    });

    render(<ConfirmClient token="old-token" />);
    await user.click(await screen.findByRole("button", { name: "Reenviar correo de verificación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esperá unos minutos");
    expect(resendButton()).toBeEnabled();
  });

  it("does not offer a resend for invalid links", async () => {
    failConfirmWith("EMAIL_VERIFICATION_TOKEN_INVALID");

    render(<ConfirmClient token="used-token" />);

    expect(await screen.findByText(/Este enlace ya no es válido/)).toBeInTheDocument();
    expect(resendButton()).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toBeInTheDocument();
  });
});
