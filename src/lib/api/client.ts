export type ApiServiceResponse = {
	success: boolean;
	message: string;
	status?: number;
	details?: unknown;
};

export type ApiDataResponse<T> = {
	success: boolean;
	message: string;
	data: T;
	details?: unknown;
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
	const isFormData = body instanceof FormData;
	const isUrlSearchParams = body instanceof URLSearchParams;
	const isBlob = body instanceof Blob;
	const isArrayBuffer = body instanceof ArrayBuffer;
	const isArrayBufferView =
		ArrayBuffer.isView(body) && body.buffer instanceof ArrayBuffer;
	const isStringBody = typeof body === "string";
	const isRawBody =
		isFormData || isUrlSearchParams || isBlob || isArrayBuffer || isArrayBufferView || isStringBody;

	if (body !== undefined && !resolvedHeaders.has("Content-Type") && !isRawBody) {
		resolvedHeaders.set("Content-Type", "application/json");
	}

	let resolvedBody: BodyInit | undefined;

	if (body === undefined) {
		resolvedBody = undefined;
	} else if (isFormData || isUrlSearchParams || isBlob || isArrayBuffer || isArrayBufferView || isStringBody) {
		if (isArrayBufferView) {
			const view = body as ArrayBufferView;
			resolvedBody = new Uint8Array(
				view.buffer as ArrayBuffer,
				view.byteOffset,
				view.byteLength
			);
		} else {
			resolvedBody = body as BodyInit;
		}
	} else {
		resolvedBody = JSON.stringify(body);
	}

	return fetch(`${API_BASE_URL}${path}`, {
		method,
		signal,
		credentials: "include",
		headers: resolvedHeaders,
		...(resolvedBody !== undefined ? { body: resolvedBody } : {}),
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
			details: payload.details ?? undefined,
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
	let payload: Partial<ApiDataResponse<T>> | Record<string, unknown> | null = null;

	try {
		payload = (await response.json()) as Partial<ApiDataResponse<T>>;
	} catch {
		payload = null;
	}

	if (response.ok) {
		if (
			typeof payload?.success === "boolean" &&
			typeof payload?.message === "string" &&
			payload.data !== undefined
		) {
			return payload as ApiDataResponse<T>;
		}

		throw new Error(invalidPayloadMessage);
	}

	const message =
		typeof payload?.message === "string" && payload.message.trim().length > 0
			? payload.message
			: invalidPayloadMessage;
	const error = new Error(message) as Error & {
		status?: number;
		details?: unknown;
	};

	error.status = response.status;
	error.details = payload?.details ?? undefined;
	throw error;
}

export function formatApiErrorDetails(details: unknown, status?: number): string {
	if (typeof details === "string") {
		return details;
	}

	if (details !== undefined && details !== null) {
		try {
			return JSON.stringify(details, null, 2);
		} catch {
			return String(details);
		}
	}

	if (typeof status === "number") {
		return `HTTP ${status}`;
	}

	return "Sin detalles adicionales.";
}
