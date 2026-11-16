import { vi } from "vitest";

export const API = "http://api.test/api/v1";

export type RecordedRequest = {
  url: string;
  path: string;
  method: string;
  headers: Headers;
  body: unknown;
  credentials: RequestCredentials | undefined;
};

type MockResponseInit = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  rawBody?: BodyInit;
};

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function okData<T>(data: T, message = "OK"): MockResponseInit {
  return { status: 200, body: { success: true, message, data } };
}

/**
 * Replaces global fetch. Responses are served in order; the last one repeats.
 * Every call is recorded with its parsed JSON body (or the raw FormData).
 */
export function mockFetch(...responses: Array<MockResponseInit | Error>) {
  const requests: RecordedRequest[] = [];
  const queue = responses.length > 0 ? responses : [{ status: 200, body: { success: true, message: "OK", data: {} } }];
  let index = 0;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const rawBody = init.body;
    let body: unknown = rawBody;
    if (typeof rawBody === "string") {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }

    requests.push({
      url,
      path: url.startsWith(API) ? url.slice(API.length) : url,
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body,
      credentials: init.credentials,
    });

    const next = queue[Math.min(index, queue.length - 1)];
    index += 1;

    if (next instanceof Error) {
      throw next;
    }

    if (next.rawBody !== undefined) {
      return new Response(next.rawBody, { status: next.status ?? 200, headers: next.headers });
    }

    return jsonResponse(next.body ?? {}, next.status ?? 200, next.headers);
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    fetchMock,
    requests,
    get last(): RecordedRequest {
      return requests[requests.length - 1];
    },
  };
}
