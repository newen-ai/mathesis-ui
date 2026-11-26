import {
	apiRequest,
	ApiServiceResponse as AuthServiceResponse,
	parseServiceResponse,
} from "@/lib/api/client";
import { traceUiAction } from "@/lib/observability/spans";

export type SessionRole = "user" | "admin";

// Cloudflare Turnstile token, sent only when the widget produced one (CAPTCHA off = never sent).
type CaptchaInput = {
	captchaToken?: string | null;
};

type RegisterInput = CaptchaInput & {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

type LoginInput = CaptchaInput & {
	email: string;
	password: string;
};

type RequestPasswordResetInput = CaptchaInput & {
	email: string;
};

function captchaBody(input: CaptchaInput): { captchaToken?: string } {
	return input.captchaToken ? { captchaToken: input.captchaToken } : {};
}

type RequestVerificationEmailInput = {
	email: string;
};

type ResetPasswordInput = {
	token: string;
	newPassword: string;
};

type ChangePasswordInput = {
	currentPassword: string;
	newPassword: string;
};

export type SessionState = "authenticated" | "unauthenticated" | "unknown";

export type SessionAccessDecision = {
	sessionState: SessionState;
	role?: SessionRole;
	isWhitelisted: boolean;
	hasVerifiedEmail: boolean;
	hasCompletedWelcomeOnboarding: boolean;
};

type WhitelistErrorDetails = {
	code?: string;
};

type SessionPayload = {
	data?: {
		user?: {
			role?: SessionRole;
			isWhitelisted?: boolean;
			hasVerifiedEmail?: boolean;
			hasCompletedWelcomeOnboarding?: boolean;
		};
	};
	details?: WhitelistErrorDetails;
};

type SessionUserPayload = {
	data?: {
		user?: {
			id?: string;
		};
	};
};

function extractSessionUserId(payload: SessionUserPayload | null | undefined) {
	const candidateId = payload?.data?.user?.id;

	return typeof candidateId === "string" && candidateId.trim() ? candidateId : null;
}

export async function register(
	input: RegisterInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/register", {
			method: "POST",
			body: {
				firstName: input.firstName,
				lastName: input.lastName,
				email: input.email,
				password: input.password,
				...captchaBody(input),
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de registro."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de registro.",
			details: "Error de red o CORS.",
		};
	}
}

export async function login(
	input: LoginInput
): Promise<AuthServiceResponse> {
	return traceUiAction("ui.login", () => requestLogin(input));
}

async function requestLogin(
	input: LoginInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/login", {
			method: "POST",
			body: {
				email: input.email,
				password: input.password,
				...captchaBody(input),
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de login."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de login.",
			details: "Error de red o CORS.",
		};
	}
}

export async function requestPasswordReset(
	input: RequestPasswordResetInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/request-reset", {
			method: "POST",
			body: {
				email: input.email,
				...captchaBody(input),
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de recuperación."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de recuperación.",
			details: "Error de red o CORS.",
		};
	}
}

export async function requestVerificationEmail(
	input: RequestVerificationEmailInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/request-verification", {
			method: "POST",
			body: {
				email: input.email,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de verificación de correo."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de verificación de correo.",
			details: "Error de red o CORS.",
		};
	}
}

// Resend from /confirm when the link expired: the backend finds the account by the old token and mails
// the new link to that account's own address.
export async function requestVerificationEmailByToken(
	token: string
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/request-verification/by-token", {
			method: "POST",
			body: {
				token,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de verificación de correo."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de verificación de correo.",
			details: "Error de red o CORS.",
		};
	}
}

export async function verifyEmail(token: string): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest(`/auth/confirm?token=${encodeURIComponent(token)}`);

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de confirmación."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos confirmar tu correo.",
			details: "Error de red o CORS.",
		};
	}
}

export async function resetPassword(
	input: ResetPasswordInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/confirm-reset", {
			method: "POST",
			body: {
				token: input.token,
				newPassword: input.newPassword,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de restablecimiento."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos restablecer tu contraseña.",
			details: "Error de red o CORS.",
		};
	}
}

export async function changePassword(
	input: ChangePasswordInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/change-password", {
			method: "POST",
			body: {
				currentPassword: input.currentPassword,
				newPassword: input.newPassword,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de cambio de contraseña."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos cambiar tu contraseña.",
			details: "Error de red o CORS.",
		};
	}
}

export async function getSessionState(): Promise<SessionState> {
	try {
		const sessionResponse = await apiRequest("/auth/session");

		if (sessionResponse.status === 401 || sessionResponse.status === 403) {
			return "unauthenticated";
		}

		if (sessionResponse.ok) return "authenticated";

		return "unknown";
	} catch {
		return "unknown";
	}
}

export async function getSessionAccessDecision(): Promise<SessionAccessDecision> {
	try {
		const sessionResponse = await apiRequest("/auth/session");

		if (sessionResponse.status === 401) {
			return {
				sessionState: "unauthenticated",
				isWhitelisted: false,
				hasVerifiedEmail: true,
				hasCompletedWelcomeOnboarding: true,
			};
		}

		if (sessionResponse.status === 403) {
			let payload: SessionPayload | null = null;
			try {
				payload = (await sessionResponse.json()) as SessionPayload;
			} catch {
				payload = null;
			}

			if (payload?.details?.code === "USER_NOT_WHITELISTED") {
				return {
					sessionState: "authenticated",
					role: payload?.data?.user?.role,
					isWhitelisted: false,
					hasVerifiedEmail: payload?.data?.user?.hasVerifiedEmail ?? true,
					hasCompletedWelcomeOnboarding:
						payload?.data?.user?.hasCompletedWelcomeOnboarding ?? true,
				};
			}

			return {
				sessionState: "unauthenticated",
				isWhitelisted: false,
				hasVerifiedEmail: true,
				hasCompletedWelcomeOnboarding: true,
			};
		}

		if (!sessionResponse.ok) {
			return {
				sessionState: "unknown",
				isWhitelisted: false,
				hasVerifiedEmail: true,
				hasCompletedWelcomeOnboarding: true,
			};
		}

		const payload = (await sessionResponse.json()) as SessionPayload;
		const role = payload?.data?.user?.role;
		const isWhitelisted = payload?.data?.user?.isWhitelisted ?? true;
		const hasVerifiedEmail = payload?.data?.user?.hasVerifiedEmail ?? true;
		const hasCompletedWelcomeOnboarding =
			payload?.data?.user?.hasCompletedWelcomeOnboarding ?? true;

		return {
			sessionState: "authenticated",
			role,
			isWhitelisted,
			hasVerifiedEmail,
			hasCompletedWelcomeOnboarding,
		};
	} catch {
		return {
			sessionState: "unknown",
			isWhitelisted: false,
			hasVerifiedEmail: true,
			hasCompletedWelcomeOnboarding: true,
		};
	}
}

export async function completeWelcomeOnboarding(): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/onboarding/complete", {
			method: "POST",
		});

		return parseServiceResponse(
			response,
			response.ok
				? "Respuesta inválida del servicio de onboarding."
				: "No pudimos completar la bienvenida en el servidor."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no está configurada."
					: "No pudimos completar tu bienvenida.",
			details: "Error de red o CORS.",
		};
	}
}

export async function getSessionUserId(): Promise<string | null> {
	try {
		const sessionResponse = await apiRequest("/auth/session");

		if (sessionResponse.status === 401 || sessionResponse.status === 403) {
			return null;
		}

		if (!sessionResponse.ok) {
			return null;
		}

		const payload = (await sessionResponse.json()) as SessionUserPayload;
		return extractSessionUserId(payload);
	} catch {
		return null;
	}
}

export type SessionContact = { id: string; email: string };

// Who is logged in, for forms that prefill the account email (bug reports). Null when there is no session.
export async function getSessionContact(): Promise<SessionContact | null> {
	try {
		const sessionResponse = await apiRequest("/auth/session");
		if (!sessionResponse.ok) {
			return null;
		}

		const payload = (await sessionResponse.json()) as { data?: { user?: { id?: unknown; email?: unknown } } };
		const id = payload?.data?.user?.id;
		const email = payload?.data?.user?.email;
		return typeof id === "string" && id && typeof email === "string" && email ? { id, email } : null;
	} catch {
		return null;
	}
}

export async function logout(): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/logout", {
			method: "POST",
		});

		return parseServiceResponse(
			response,
			response.ok
				? "Respuesta inválida del servicio de logout."
				: "No pudimos cerrar la sesión en el servidor."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos conectar con el servicio de logout.",
			details: "Error de red o CORS.",
		};
	}
}

export async function requestWhitelistAccess(message?: string): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/whitelist-request", {
			method: "POST",
			body: {
				message,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta inválida del servicio de solicitud de whitelist."
		);
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no esta configurada."
					: "No pudimos enviar tu solicitud de whitelist.",
			details: "Error de red o CORS.",
		};
	}
}
