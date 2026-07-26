import {
	apiRequest,
	ApiServiceResponse as AuthServiceResponse,
	parseServiceResponse,
} from "@/lib/api/client";

type RegisterInput = {
	email: string;
	password: string;
};

type LoginInput = {
	email: string;
	password: string;
};

export type SessionState = "authenticated" | "unauthenticated" | "unknown";

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
