export type ApiServiceResponse = {
	success: boolean;
	message: string;
	status?: number;
	details?: string;
};

export type ApiDataResponse<T> = {
	success: boolean;
	message: string;
	data: T;
	details?: string;
};

type ApiRequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
	headers?: HeadersInit;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function getApiBaseUrl() {
	return API_BASE_URL;
}

export async function apiRequest(
	path: string,
	options: ApiRequestOptions = {}
): Promise<Response> {
	if (!API_BASE_URL) {
		throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
	}

	const { body, headers, method = "GET", signal } = options;
	const resolvedHeaders = new Headers(headers);

	if (body !== undefined && !resolvedHeaders.has("Content-Type")) {
		resolvedHeaders.set("Content-Type", "application/json");
	}

	return fetch(`${API_BASE_URL}${path}`, {
		method,
		signal,
		credentials: "include",
		headers: resolvedHeaders,
		...(body !== undefined ? { body: JSON.stringify(body) } : {}),
	});
}

export async function parseServiceResponse(
	response: Response,
	invalidPayloadMessage: string
): Promise<ApiServiceResponse> {
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
		return {
			success: payload.success,
			message: payload.message,
			status: response.status,
			details:
				typeof payload.details === "string" ? payload.details : undefined,
		};
	}

	return {
		success: false,
		message: invalidPayloadMessage,
		status: response.status,
		details: response.statusText || undefined,
	};
}

export async function parseDataResponse<T>(
	response: Response,
	invalidPayloadMessage: string
): Promise<ApiDataResponse<T>> {
	const payload = (await response.json()) as Partial<ApiDataResponse<T>>;

	if (
		typeof payload?.success !== "boolean" ||
		typeof payload?.message !== "string" ||
		payload.data === undefined
	) {
		throw new Error(invalidPayloadMessage);
	}

	return payload as ApiDataResponse<T>;
}
