import { describe, expect, it } from "vitest";
import { API, jsonResponse, mockFetch } from "@/test/fetch-mock";
import {
  apiRequest,
  formatApiErrorDetails,
  getApiBaseUrl,
  parseDataResponse,
  parseServiceResponse,
} from "./client";

describe("apiRequest", () => {
  it("prefixes the base URL, sends cookies and JSON-encodes plain bodies", async () => {
    const mock = mockFetch({ body: {} });

    await apiRequest("/things", { method: "POST", body: { a: 1 } });

    expect(getApiBaseUrl()).toBe(API);
    expect(mock.last.url).toBe(`${API}/things`);
    expect(mock.last.method).toBe("POST");
    expect(mock.last.credentials).toBe("include");
    expect(mock.last.headers.get("Content-Type")).toBe("application/json");
    expect(mock.last.body).toEqual({ a: 1 });
  });

  it("defaults to GET without body or content type", async () => {
    const mock = mockFetch({ body: {} });

    await apiRequest("/things");

    expect(mock.last.method).toBe("GET");
    expect(mock.last.body).toBeUndefined();
    expect(mock.last.headers.has("Content-Type")).toBe(false);
  });

  it("passes raw bodies through untouched and lets the browser set multipart headers", async () => {
    const mock = mockFetch({ body: {} });
    const form = new FormData();
    form.set("title", "Hola");

    await apiRequest("/upload", { method: "POST", body: form });
    expect(mock.last.body).toBe(form);
    expect(mock.last.headers.has("Content-Type")).toBe(false);

    await apiRequest("/text", { method: "POST", body: "plain" });
    expect(mock.last.body).toBe("plain");

    const params = new URLSearchParams({ a: "1" });
    await apiRequest("/params", { method: "POST", body: params });
    expect(mock.last.body).toBe(params);

    const bytes = new Uint8Array([1, 2, 3]);
    await apiRequest("/bytes", { method: "POST", body: bytes });
    expect(Array.from(mock.last.body as Uint8Array)).toEqual([1, 2, 3]);
  });

  it("keeps an explicit content type", async () => {
    const mock = mockFetch({ body: {} });

    await apiRequest("/things", { method: "PUT", body: { a: 1 }, headers: { "Content-Type": "application/merge-patch+json" } });

    expect(mock.last.headers.get("Content-Type")).toBe("application/merge-patch+json");
  });
});

describe("parseServiceResponse", () => {
  it("returns success, message, status and details from a valid payload", async () => {
    const result = await parseServiceResponse(jsonResponse({ success: false, message: "NOPE", details: { code: "X" } }, 409), "invalid");

    expect(result).toEqual({ success: false, message: "NOPE", status: 409, details: { code: "X" } });
  });

  it("falls back to the invalid message for non-JSON or malformed payloads", async () => {
    const notJson = await parseServiceResponse(new Response("<html>", { status: 502, statusText: "Bad Gateway" }), "invalid");
    expect(notJson).toEqual({ success: false, message: "invalid", status: 502, details: "Bad Gateway" });

    const malformed = await parseServiceResponse(jsonResponse({ ok: true }), "invalid");
    expect(malformed.message).toBe("invalid");
  });
});

describe("parseDataResponse", () => {
  it("returns the envelope when the response is ok", async () => {
    const result = await parseDataResponse<{ id: string }>(jsonResponse({ success: true, message: "OK", data: { id: "1" } }), "invalid");

    expect(result.data).toEqual({ id: "1" });
  });

  it("throws the invalid message when an ok response has no data", async () => {
    await expect(parseDataResponse(jsonResponse({ success: true, message: "OK" }), "invalid")).rejects.toThrow("invalid");
  });

  it("throws the server message with status and details on errors", async () => {
    const error = (await parseDataResponse(jsonResponse({ success: false, message: "Forbidden", details: { code: "X" } }, 403), "invalid").catch(
      (caught: unknown) => caught
    )) as Error & { status?: number; details?: unknown };

    expect(error.message).toBe("Forbidden");
    expect(error.status).toBe(403);
    expect(error.details).toEqual({ code: "X" });
  });

  it("uses the invalid message when the error payload has no usable message", async () => {
    const error = await parseDataResponse(new Response("oops", { status: 500 }), "invalid").catch((caught: unknown) => caught as Error);
    expect(error.message).toBe("invalid");

    const blank = await parseDataResponse(jsonResponse({ message: "  " }, 400), "invalid").catch((caught: unknown) => caught as Error);
    expect(blank.message).toBe("invalid");
  });
});

describe("formatApiErrorDetails", () => {
  it("formats strings, objects, statuses and the empty case", () => {
    expect(formatApiErrorDetails("texto")).toBe("texto");
    expect(formatApiErrorDetails({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatApiErrorDetails(undefined, 404)).toBe("HTTP 404");
    expect(formatApiErrorDetails(null)).toBe("Sin detalles adicionales.");

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatApiErrorDetails(circular)).toBe("[object Object]");
  });
});
