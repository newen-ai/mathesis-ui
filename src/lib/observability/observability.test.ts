import { afterEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  startSpan: vi.fn((_options: { name: string; op: string }, callback: () => unknown) => callback()),
}));

vi.mock("@sentry/nextjs", () => sentry);

import { assertObservabilityBuildEnv } from "./build-env";
import {
  buildSentryOptions,
  readPublicSentryEnv,
  resolveTracePropagationTargets,
  resolveTracesSampleRate,
} from "./sentry-options";
import {
  isSensitiveKey,
  scrubAttributes,
  scrubBreadcrumb,
  scrubEvent,
  scrubQueryString,
  scrubSpan,
  scrubText,
  scrubUrl,
} from "./scrub";
import { traceUiAction } from "./spans";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("scrub", () => {
  it("detects sensitive keys and scrubs text", () => {
    expect(isSensitiveKey("token")).toBe(true);
    expect(isSensitiveKey("limit")).toBe(false);
    expect(isSensitiveKey("x-vercel-protection-bypass")).toBe(true);
    expect(scrubText(`ana@example.com ${JWT}`)).toBe("[Filtered] [Filtered]");
  });

  it("scrubs query strings and URLs", () => {
    expect(scrubQueryString("?token=abc&tab=mine")).toBe("?token=[Filtered]&tab=mine");
    expect(scrubQueryString("flag&%E0%A4%A=1")).toBe("flag&%E0%A4%A=1");
    expect(scrubQueryString("?")).toBe("?");
    expect(scrubUrl("https://app.test/verificar/?token=abc#frag")).toBe(
      "https://app.test/verificar/?token=[Filtered]#[Filtered]"
    );
    expect(scrubUrl("/ateneo/groups/g1/")).toBe("/ateneo/groups/g1/");
  });

  it("drops identifying attributes and scrubs URL ones", () => {
    expect(
      scrubAttributes({
        "user.email": "a@b.com",
        "url.query": "token=1",
        "url.full": "https://api.test/x?token=1",
        "http.url": { value: "/x?email=a@b.com" },
        "browser.name": "Chrome",
        count: 2,
      })
    ).toEqual({
      "url.full": "https://api.test/x?token=[Filtered]",
      "http.url": { value: "/x?email=[Filtered]" },
      "browser.name": "Chrome",
      count: 2,
    });
  });

  it("scrubs spans and breadcrumbs", () => {
    expect(scrubSpan({ name: "/verificar/?token=abc", attributes: { "user.id": "1" } })).toEqual({
      name: "/verificar/?token=[Filtered]",
      attributes: {},
    });
    expect(scrubSpan({ name: "pageload" })).toEqual({ name: "pageload" });
    expect(
      scrubBreadcrumb({ message: "a@b.com", data: { from: "/verificar/?token=1", to: "/x", status: 200, note: "c@d.com" } })
    ).toEqual({
      message: "[Filtered]",
      data: { from: "/verificar/?token=[Filtered]", to: "/x", status: 200, note: "[Filtered]" },
    });
    expect(scrubBreadcrumb({})).toEqual({});
  });

  it("strips bodies, cookies, identity and headers from events", () => {
    const event = scrubEvent({
      message: "for a@b.com",
      transaction: "/verificar/?token=x",
      user: { email: "a@b.com" },
      request: {
        url: "https://app.test/verificar/?token=x",
        query_string: "token=x",
        data: "content",
        cookies: { a: "b" },
        env: {},
        headers: { Cookie: "a=b", Referer: "https://app.test/?token=y", "User-Agent": "k6" },
      },
      exception: { values: [{ value: `bad ${JWT}` }, {}] },
      breadcrumbs: [{ message: "ok" }],
      contexts: { trace: { data: { "user.id": "1", ok: true } } },
    });

    expect(event).toEqual({
      message: "for [Filtered]",
      transaction: "/verificar/?token=[Filtered]",
      request: {
        url: "https://app.test/verificar/?token=[Filtered]",
        query_string: "token=[Filtered]",
        headers: { Referer: "https://app.test/?token=[Filtered]", "User-Agent": "k6" },
      },
      exception: { values: [{ value: "bad [Filtered]" }, {}] },
      breadcrumbs: [{ message: "ok" }],
      contexts: { trace: { data: { ok: true } } },
    });
    expect(scrubEvent({ request: { query_string: [["a", "b"]] } })).toEqual({ request: {} });
  });
});

describe("sentry options", () => {
  it("reads the public env with static access", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://k@o0.ingest.sentry.io/1");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "test");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE", "0.5");
    expect(readPublicSentryEnv()).toMatchObject({
      dsn: "https://k@o0.ingest.sentry.io/1",
      environment: "test",
      tracesSampleRate: "0.5",
      apiBaseUrl: "http://api.test/api/v1",
    });
  });

  it("resolves sample rates with environment defaults", () => {
    expect(resolveTracesSampleRate(undefined, "test")).toBe(1);
    expect(resolveTracesSampleRate(" ", "production")).toBe(0.1);
    expect(resolveTracesSampleRate("0.25", "production")).toBe(0.25);
    expect(() => resolveTracesSampleRate("2", "test")).toThrow("between 0 and 1");
  });

  it("targets only the API origin for trace propagation", () => {
    const [target] = resolveTracePropagationTargets("https://api.sophium.test/api/v1");
    expect(target).toBeInstanceOf(RegExp);
    expect((target as RegExp).test("https://api.sophium.test/api/v1/ateneo/groups")).toBe(true);
    expect((target as RegExp).test("https://api.sophium.test.evil.com/x")).toBe(false);
    expect(resolveTracePropagationTargets(undefined)).toEqual([]);
    expect(resolveTracePropagationTargets("not a url")).toEqual([]);
  });

  it("returns null without a DSN and full options with one", () => {
    expect(buildSentryOptions({ dsn: " " })).toBeNull();

    const options = buildSentryOptions({ dsn: "https://k@o0.ingest.sentry.io/1", apiBaseUrl: "https://api.test/api/v1" });
    expect(options).toMatchObject({ environment: "local", tracesSampleRate: 1, dataCollection: { userInfo: false, httpBodies: [] } });
    expect(options?.beforeSend({ user: { id: "1" }, message: "a@b.com" })).toEqual({ message: "[Filtered]" });
    expect(options?.beforeSendSpan({ name: "/x?token=1" })).toEqual({ name: "/x?token=[Filtered]" });
    expect(options?.beforeBreadcrumb({ message: "a@b.com" })).toEqual({ message: "[Filtered]" });
  });
});

describe("build env", () => {
  it("does nothing outside Vercel", () => {
    expect(() => assertObservabilityBuildEnv({})).not.toThrow();
  });

  it("fails on Vercel when Sentry variables are missing", () => {
    expect(() => assertObservabilityBuildEnv({ VERCEL: "1", NEXT_PUBLIC_SENTRY_DSN: "x", SENTRY_ORG: " " })).toThrow(
      "NEXT_PUBLIC_SENTRY_ENVIRONMENT, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT"
    );
    expect(() =>
      assertObservabilityBuildEnv({
        VERCEL: "1",
        NEXT_PUBLIC_SENTRY_DSN: "x",
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: "test",
        SENTRY_AUTH_TOKEN: "t",
        SENTRY_ORG: "o",
        SENTRY_PROJECT: "p",
      })
    ).not.toThrow();
  });
});

describe("traceUiAction", () => {
  it("wraps the action in a ui.action span", async () => {
    await expect(traceUiAction("ui.login", async () => "ok")).resolves.toBe("ok");
    expect(sentry.startSpan).toHaveBeenCalledWith({ name: "ui.login", op: "ui.action" }, expect.any(Function));
  });
});
