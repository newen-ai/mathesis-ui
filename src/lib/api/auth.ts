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

export async function hasSession(): Promise<boolean> {
	try {
		const response = await apiRequest("/profile/me");

		if (response.status === 404) return true;

		if (!response.ok) return false;

		const payload = (await response.json()) as Partial<AuthServiceResponse>;
		return payload.success === true;
	} catch {
		return false;
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
