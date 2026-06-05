export type AuthServiceResponse = {
	success: boolean;
	message: string;
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

		const payload = (await response.json()) as Partial<AuthServiceResponse>;

		if (
			typeof payload?.success === "boolean" &&
			typeof payload?.message === "string"
		) {
			return {
				success: payload.success,
				message: payload.message,
			};
		}

		return {
			success: false,
			message: "Respuesta invalida del servicio de registro.",
		};
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de registro.",
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

		const payload = (await response.json()) as Partial<AuthServiceResponse>;

		if (
			typeof payload?.success === "boolean" &&
			typeof payload?.message === "string"
		) {
			return {
				success: payload.success,
				message: payload.message,
			};
		}

		return {
			success: false,
			message: "Respuesta invalida del servicio de login.",
		};
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de login.",
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
			headers: {
				"Content-Type": "application/json",
			},
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

		const payload = (await response.json()) as Partial<AuthServiceResponse>;

		if (
			typeof payload?.success === "boolean" &&
			typeof payload?.message === "string"
		) {
			return {
				success: payload.success,
				message: payload.message,
			};
		}

		if (!response.ok) {
			return {
				success: false,
				message: "No pudimos cerrar la sesion en el servidor.",
			};
		}

		return {
			success: true,
			message: "Sesion cerrada.",
		};
	} catch {
		return {
			success: false,
			message: "No pudimos conectar con el servicio de logout.",
		};
	}
}
