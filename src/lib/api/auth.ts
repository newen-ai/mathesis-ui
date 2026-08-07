import {
	apiRequest,
	ApiServiceResponse as AuthServiceResponse,
	parseServiceResponse,
} from "@/lib/api/client";

export type SessionRole = "user" | "admin";

type RegisterInput = {
	email: string;
	password: string;
};

type LoginInput = {
	email: string;
	password: string;
};

export type SessionState = "authenticated" | "unauthenticated" | "unknown";

export type SessionAccessDecision = {
	sessionState: SessionState;
	role?: SessionRole;
	isWhitelisted: boolean;
};

type WhitelistErrorDetails = {
	code?: string;
};

type SessionPayload = {
	data?: {
		user?: {
			role?: SessionRole;
			isWhitelisted?: boolean;
		};
	};
	details?: WhitelistErrorDetails;
};

type SessionUserPayload = {
	data?: {
		id?: string;
		userId?: string;
		user?: {
			id?: string;
			userId?: string;
		};
	};
	userId?: string;
	id?: string;
	user?: {
		id?: string;
		userId?: string;
	};
};

function extractSessionUserId(payload: SessionUserPayload | null | undefined) {
	const candidateId =
		payload?.data?.id;

	return typeof candidateId === "string" && candidateId.trim() ? candidateId : null;
}

export async function register(
	input: RegisterInput
): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/register", {
			method: "POST",
			body: {
				email: input.email,
				password: input.password,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta invalida del servicio de registro."
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
	try {
		const response = await apiRequest("/auth/login", {
			method: "POST",
			body: {
				email: input.email,
				password: input.password,
			},
		});

		return parseServiceResponse(
			response,
			"Respuesta invalida del servicio de login."
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

export async function verifyEmail(token: string): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest(`/auth/confirm?token=${encodeURIComponent(token)}`);

		return parseServiceResponse(
			response,
			"Respuesta invalida del servicio de confirmacion."
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
			return { sessionState: "unauthenticated", isWhitelisted: false };
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
				};
			}

			return { sessionState: "unauthenticated", isWhitelisted: false };
		}

		if (!sessionResponse.ok) {
			return { sessionState: "unknown", isWhitelisted: false };
		}

		const payload = (await sessionResponse.json()) as SessionPayload;
		const role = payload?.data?.user?.role;
		const isWhitelisted = payload?.data?.user?.isWhitelisted ?? true;

		return {
			sessionState: "authenticated",
			role,
			isWhitelisted,
		};
	} catch {
		return { sessionState: "unknown", isWhitelisted: false };
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

export async function logout(): Promise<AuthServiceResponse> {
	try {
		const response = await apiRequest("/auth/logout", {
			method: "POST",
		});

		return parseServiceResponse(
			response,
			response.ok
				? "Respuesta invalida del servicio de logout."
				: "No pudimos cerrar la sesion en el servidor."
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
			"Respuesta invalida del servicio de solicitud de whitelist."
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
