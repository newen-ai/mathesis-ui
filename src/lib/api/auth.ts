export type AuthServiceResponse = {
	success: boolean;
	message: string;
	status?: number;
	details?: string;
};

type RegisterInput = {
	email: string;
	password: string;
};

type LoginInput = {
	email: string;
	password: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function parseAuthResponse(
	response: Response,
	invalidPayloadMessage: string
): Promise<AuthServiceResponse> {
	let payload: Record<string, unknown> | null = null;

	try {
		payload = (await response.json()) as Record<string, unknown>;
	} catch {
		payload = null;
	}

	if (
		typeof payload?.success === "boolean" &&
		typeof payload?.message === "string"
	) {
		const detailsValue = payload?.details;
		return {
			success: payload.success,
			message: payload.message,
			status: response.status,
			details:
				typeof detailsValue === "string" ? detailsValue : undefined,
		};
	}

	return {
		success: false,
		message: invalidPayloadMessage,
		status: response.status,
		details: response.statusText || undefined,
	};
}

export async function register(
	input: RegisterInput
): Promise<AuthServiceResponse> {
	if (!API_BASE_URL) {
		return {
			success: false,
			message: "NEXT_PUBLIC_API_BASE_URL no esta configurada.",
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/register`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: input.email,
				password: input.password,
			}),
		});

		return parseAuthResponse(
			response,
			"Respuesta invalida del servicio de registro."
		);
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de registro.",
			details: "Error de red o CORS.",
		};
	}
}

export async function login(
	input: LoginInput
): Promise<AuthServiceResponse> {
	if (!API_BASE_URL) {
		return {
			success: false,
			message: "NEXT_PUBLIC_API_BASE_URL no esta configurada.",
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: input.email,
				password: input.password,
			}),
		});

		return parseAuthResponse(response, "Respuesta invalida del servicio de login.");
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de login.",
			details: "Error de red o CORS.",
		};
	}
}

export async function hasSession(): Promise<boolean> {
	if (!API_BASE_URL) {
		return false;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/profile/me`, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) return false;

		const payload = (await response.json()) as Partial<AuthServiceResponse>;
		return payload.success === true;
	} catch {
		return false;
	}
}

export async function logout(): Promise<AuthServiceResponse> {
	if (!API_BASE_URL) {
		return {
			success: false,
			message: "NEXT_PUBLIC_API_BASE_URL no esta configurada.",
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/logout`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		});

		return parseAuthResponse(
			response,
			response.ok
				? "Respuesta invalida del servicio de logout."
				: "No pudimos cerrar la sesion en el servidor."
		);
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de logout.",
			details: "Error de red o CORS.",
		};
	}
}
