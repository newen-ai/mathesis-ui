import { describe, expect, it } from "vitest";
import { mockFetch } from "@/test/fetch-mock";
import {
  changePassword,
  completeWelcomeOnboarding,
  getSessionAccessDecision,
  getSessionState,
  getSessionUserId,
  login,
  logout,
  register,
  requestPasswordReset,
  requestVerificationEmail,
  resetPassword,
  verifyEmail,
} from "./auth";

const ok = { status: 200, body: { success: true, message: "OK" } };

describe("auth service calls", () => {
  it.each([
    ["register", () => register({ firstName: "Ana", lastName: "Paz", email: "a@x.com", password: "P4ss!" }), "POST", "/auth/register", { firstName: "Ana", lastName: "Paz", email: "a@x.com", password: "P4ss!" }],
    ["login", () => login({ email: "a@x.com", password: "P4ss!" }), "POST", "/auth/login", { email: "a@x.com", password: "P4ss!" }],
    ["requestPasswordReset", () => requestPasswordReset({ email: "a@x.com" }), "POST", "/auth/request-reset", { email: "a@x.com" }],
    // Turnstile token: sent only when there is one.
    ["register (captcha)", () => register({ firstName: "Ana", lastName: "Paz", email: "a@x.com", password: "P4ss!", captchaToken: "tok" }), "POST", "/auth/register", { firstName: "Ana", lastName: "Paz", email: "a@x.com", password: "P4ss!", captchaToken: "tok" }],
    ["login (captcha)", () => login({ email: "a@x.com", password: "P4ss!", captchaToken: "tok" }), "POST", "/auth/login", { email: "a@x.com", password: "P4ss!", captchaToken: "tok" }],
    ["login (no captcha token)", () => login({ email: "a@x.com", password: "P4ss!", captchaToken: null }), "POST", "/auth/login", { email: "a@x.com", password: "P4ss!" }],
    ["requestPasswordReset (captcha)", () => requestPasswordReset({ email: "a@x.com", captchaToken: "tok" }), "POST", "/auth/request-reset", { email: "a@x.com", captchaToken: "tok" }],
    ["requestVerificationEmail", () => requestVerificationEmail({ email: "a@x.com" }), "POST", "/auth/request-verification", { email: "a@x.com" }],
    ["verifyEmail", () => verifyEmail("a b&c"), "GET", "/auth/confirm?token=a%20b%26c", undefined],
    ["resetPassword", () => resetPassword({ token: "t", newPassword: "N3w!" }), "POST", "/auth/confirm-reset", { token: "t", newPassword: "N3w!" }],
    ["changePassword", () => changePassword({ currentPassword: "a", newPassword: "b" }), "POST", "/auth/change-password", { currentPassword: "a", newPassword: "b" }],
    ["completeWelcomeOnboarding", () => completeWelcomeOnboarding(), "POST", "/auth/onboarding/complete", undefined],
    ["logout", () => logout(), "POST", "/auth/logout", undefined],
  ] as const)("%s calls the backend contract", async (_name, call, method, path, body) => {
    const mock = mockFetch(ok);

    const result = await call();

    expect(result).toMatchObject({ success: true, message: "OK", status: 200 });
    expect(mock.last.method).toBe(method);
    expect(mock.last.path).toBe(path);
    expect(mock.last.body).toEqual(body);
  });

  it.each([
    ["register", () => register({ firstName: "a", lastName: "b", email: "c", password: "d" }), "No pudimos conectar con el servicio de registro."],
    ["login", () => login({ email: "c", password: "d" }), "No pudimos conectar con el servicio de login."],
    ["requestPasswordReset", () => requestPasswordReset({ email: "c" }), "No pudimos conectar con el servicio de recuperación."],
    ["requestVerificationEmail", () => requestVerificationEmail({ email: "c" }), "No pudimos conectar con el servicio de verificación de correo."],
    ["verifyEmail", () => verifyEmail("t"), "No pudimos confirmar tu correo."],
    ["resetPassword", () => resetPassword({ token: "t", newPassword: "n" }), "No pudimos restablecer tu contraseña."],
    ["changePassword", () => changePassword({ currentPassword: "a", newPassword: "b" }), "No pudimos cambiar tu contraseña."],
    ["completeWelcomeOnboarding", () => completeWelcomeOnboarding(), "No pudimos completar tu bienvenida."],
    ["logout", () => logout(), "No pudimos conectar con el servicio de logout."],
  ] as const)("%s turns network failures into a friendly error", async (_name, call, message) => {
    mockFetch(new TypeError("Failed to fetch"));

    const result = await call();

    expect(result).toEqual({ success: false, message, details: "Error de red o CORS." });
  });

  it("surfaces backend validation errors as returned", async () => {
    mockFetch({ status: 409, body: { success: false, message: "Email is already registered" } });

    const result = await register({ firstName: "a", lastName: "b", email: "c", password: "d" });

    expect(result).toEqual({ success: false, message: "Email is already registered", status: 409, details: undefined });
  });

  it("explains non-ok logout and onboarding responses without a JSON body", async () => {
    mockFetch({ status: 500, rawBody: "boom" });

    expect((await logout()).message).toBe("No pudimos cerrar la sesión en el servidor.");
    expect((await completeWelcomeOnboarding()).message).toBe("No pudimos completar la bienvenida en el servidor.");
  });
});

describe("getSessionState", () => {
  it.each([
    [200, "authenticated"],
    [401, "unauthenticated"],
    [403, "unauthenticated"],
    [500, "unknown"],
  ] as const)("maps HTTP %s to %s", async (status, expected) => {
    mockFetch({ status, body: {} });
    expect(await getSessionState()).toBe(expected);
  });

  it("is unknown when the network fails", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    expect(await getSessionState()).toBe("unknown");
  });
});

describe("getSessionAccessDecision", () => {
  it("reads role and flags from an active session", async () => {
    mockFetch({
      body: {
        success: true,
        data: { user: { role: "admin", isWhitelisted: false, hasVerifiedEmail: false, hasCompletedWelcomeOnboarding: false } },
      },
    });

    expect(await getSessionAccessDecision()).toEqual({
      sessionState: "authenticated",
      role: "admin",
      isWhitelisted: false,
      hasVerifiedEmail: false,
      hasCompletedWelcomeOnboarding: false,
    });
  });

  it("defaults missing flags to permissive values", async () => {
    mockFetch({ body: { success: true, data: { user: {} } } });

    expect(await getSessionAccessDecision()).toMatchObject({
      sessionState: "authenticated",
      isWhitelisted: true,
      hasVerifiedEmail: true,
      hasCompletedWelcomeOnboarding: true,
    });
  });

  it("treats 401 as logged out", async () => {
    mockFetch({ status: 401, body: {} });
    expect((await getSessionAccessDecision()).sessionState).toBe("unauthenticated");
  });

  it("keeps the session when a 403 is a whitelist gate", async () => {
    mockFetch({
      status: 403,
      body: { details: { code: "USER_NOT_WHITELISTED" }, data: { user: { role: "user", hasVerifiedEmail: false } } },
    });

    expect(await getSessionAccessDecision()).toEqual({
      sessionState: "authenticated",
      role: "user",
      isWhitelisted: false,
      hasVerifiedEmail: false,
      hasCompletedWelcomeOnboarding: true,
    });
  });

  it("treats any other 403 (or an unreadable one) as logged out", async () => {
    mockFetch({ status: 403, body: { details: { code: "OTHER" } } });
    expect((await getSessionAccessDecision()).sessionState).toBe("unauthenticated");

    mockFetch({ status: 403, rawBody: "not json" });
    expect((await getSessionAccessDecision()).sessionState).toBe("unauthenticated");
  });

  it("is unknown on server errors and network failures", async () => {
    mockFetch({ status: 503, body: {} });
    expect((await getSessionAccessDecision()).sessionState).toBe("unknown");

    mockFetch(new TypeError("Failed to fetch"));
    expect((await getSessionAccessDecision()).sessionState).toBe("unknown");
  });
});

describe("getSessionUserId", () => {
  it("returns the user id from the session", async () => {
    mockFetch({ body: { data: { user: { id: "u1" } } } });
    expect(await getSessionUserId()).toBe("u1");
  });

  it.each([
    ["401", { status: 401, body: {} }],
    ["403", { status: 403, body: {} }],
    ["500", { status: 500, body: {} }],
    ["blank id", { body: { data: { user: { id: "  " } } } }],
  ])("returns null on %s", async (_label, response) => {
    mockFetch(response);
    expect(await getSessionUserId()).toBeNull();
  });

  it("returns null when the network fails", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    expect(await getSessionUserId()).toBeNull();
  });
});
