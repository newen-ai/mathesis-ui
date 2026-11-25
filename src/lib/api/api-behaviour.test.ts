import { describe, expect, it, vi } from "vitest";
import { mockFetch, okData } from "@/test/fetch-mock";
import * as admin from "./admin";
import * as ateneo from "./ateneo";
import * as enterprise from "./enterprise";
import * as feed from "./feed";
import * as notifications from "./notifications";
import * as profile from "./profile";

const profileOutput = { firstName: "Ana", lastName: "Paz", interests: [] };

describe("profile API", () => {
  it("unwraps the profile from the /me envelope", async () => {
    mockFetch(okData({ id: "u1", email: "a@x.com", role: "user", profile: profileOutput }));
    await expect(profile.getMyProfile()).resolves.toEqual(profileOutput);
  });

  it("accepts a bare profile payload", async () => {
    mockFetch(okData(profileOutput));
    await expect(profile.getProfileByUserId("u2")).resolves.toEqual(profileOutput);
  });

  it("keeps only public fields of another member's profile", async () => {
    mockFetch(
      okData({
        id: "u2",
        email: "otra@x.com",
        profile: { ...profileOutput, locationCity: "Rosario", dateOfBirth: "1990-05-17", nationality: "AR", locationPostalCode: "S2000" }
      })
    );
    const other = await profile.getProfileByUserId("u2");
    expect(other).toMatchObject({ firstName: "Ana", locationCity: "Rosario" });
    for (const field of ["dateOfBirth", "nationality", "locationPostalCode"]) {
      expect(other).not.toHaveProperty(field);
    }
    expect(JSON.stringify(other)).not.toMatch(/1990|S2000|otra@x\.com|"AR"/);
  });

  it("reports an empty profile source on 404 or a null profile", async () => {
    mockFetch({ status: 404, body: {} });
    const notFound = await profile.getMyProfile().catch((error: unknown) => error);
    expect(profile.isProfileSourceEmptyError(notFound)).toBe(true);

    mockFetch(okData({ id: "u1", profile: null }));
    const nullProfile = await profile.getMyProfile().catch((error: unknown) => error);
    expect(profile.isProfileSourceEmptyError(nullProfile)).toBe(true);

    expect(profile.isProfileSourceEmptyError(new Error("other"))).toBe(false);
  });

  it("throws a ProfileHttpError carrying the backend details", async () => {
    mockFetch({ status: 403, body: { details: { code: "USER_NOT_WHITELISTED", redirectTo: "/whitelist-access" } } });
    const error = (await profile.getMyProfile().catch((caught: unknown) => caught)) as profile.ProfileHttpError;
    expect(error).toBeInstanceOf(profile.ProfileHttpError);
    expect(error.status).toBe(403);
    expect(error.details).toEqual({ code: "USER_NOT_WHITELISTED", redirectTo: "/whitelist-access" });

    mockFetch({ status: 403, rawBody: "not json" });
    const blocked = (await profile.getProfileByUserId("u2").catch((caught: unknown) => caught)) as profile.ProfileHttpError;
    expect(blocked.status).toBe(403);
    expect(blocked.details).toBeUndefined();
  });

  it("reads identity and email, returning null on any failure", async () => {
    mockFetch(okData({ id: "u1", email: "a@x.com" }));
    expect(await profile.getMyProfileIdentity()).toBe("u1");
    expect(await profile.getMyProfileEmail()).toBe("a@x.com");

    mockFetch(okData({ id: "u1", email: "  " }));
    expect(await profile.getMyProfileEmail()).toBeNull();

    mockFetch({ status: 401, body: {} });
    expect(await profile.getMyProfileIdentity()).toBeNull();
    expect(await profile.getMyProfileEmail()).toBeNull();

    mockFetch(new TypeError("Failed to fetch"));
    expect(await profile.getMyProfileIdentity()).toBeNull();
    expect(await profile.getMyProfileEmail()).toBeNull();
    expect(await profile.getMyPreferences()).toBeNull();
  });

  it("returns preferences and null when they cannot be read", async () => {
    mockFetch(okData({ themePreference: "dark" }));
    expect(await profile.getMyPreferences()).toEqual({ themePreference: "dark" });

    mockFetch({ status: 500, body: {} });
    expect(await profile.getMyPreferences()).toBeNull();
  });

  it("turns network failures of mutations into friendly errors", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    expect(await profile.saveMyProfile({ firstName: "a", lastName: "b" })).toEqual({ success: false, message: "Could not connect to profile save service" });
    expect((await profile.patchWorkExperiences({ operations: [] })).message).toBe("Could not connect to work experiences service");
    expect((await profile.patchEducationHistory({ operations: [] })).message).toBe("Could not connect to education history service");
    expect((await profile.sendContactMessage("OTHER" as Parameters<typeof profile.sendContactMessage>[0], "x")).message).toBe(
      "Could not connect to support service"
    );
    expect((await profile.submitBugReport({ title: "t", description: "d", pageUrl: "u", screenshots: [] })).message).toBe(
      "Could not connect to bug report service"
    );
    expect((await profile.updateMyPreferences("dark")).message).toBe("Could not connect to profile service");
    expect(await profile.searchProfiles("ana")).toMatchObject({ success: false, data: [] });
    expect(await profile.searchInterestSuggestions("lógica")).toMatchObject({ success: false, data: [] });
  });

  it("rethrows aborts from search so callers can ignore stale requests", async () => {
    const abort = new DOMException("aborted", "AbortError");
    mockFetch(abort);

    await expect(profile.searchProfiles("ana")).rejects.toBe(abort);
    await expect(profile.searchInterestSuggestions("lógica")).rejects.toBe(abort);
  });

  it("returns search results", async () => {
    mockFetch(okData([{ userId: "u1", firstName: "Ana", lastName: "Paz", profileImageUrl: null }]));
    const result = await profile.searchProfiles("ana");
    expect(result.data).toHaveLength(1);
  });
});

describe("attachment downloads", () => {
  it("parses RFC 5987 and plain file names for topic attachments", async () => {
    mockFetch({ rawBody: "png", headers: { "content-disposition": "inline; filename=\"a.png\"; filename*=UTF-8''f%C3%B3rmula%20final.png" } });
    expect((await ateneo.downloadAteneoTopicAttachment("g", "t", "a")).fileName).toBe("fórmula final.png");

    mockFetch({ rawBody: "png", headers: { "content-disposition": 'attachment; filename="doc.pdf"' } });
    expect((await ateneo.downloadAteneoTopicAttachment("g", "t", "a")).fileName).toBe("doc.pdf");

    mockFetch({ rawBody: "png", headers: { "content-disposition": "attachment; filename*=UTF-8''%E0%A4%A" } });
    expect((await ateneo.downloadAteneoTopicAttachment("g", "t", "a")).fileName).toBe("%E0%A4%A");

    mockFetch({ rawBody: "png" });
    expect((await ateneo.downloadAteneoTopicAttachment("g", "t", "a")).fileName).toBeNull();
  });

  it("downloads feed PDFs and classifies failures", async () => {
    mockFetch({ rawBody: "%PDF", headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="paper.pdf"' } });
    const file = await feed.downloadFeedAttachmentFile("p", "a");
    expect(file.fileName).toBe("paper.pdf");
    expect(await file.blob.text()).toBe("%PDF");

    mockFetch({ rawBody: "%PDF", headers: { "content-type": "application/pdf" } });
    expect(await (await feed.downloadFeedAttachment("p", "a")).text()).toBe("%PDF");

    for (const [status, headers, code] of [
      [401, {}, "UNAUTHORIZED"],
      [404, {}, "NOT_FOUND"],
      [500, {}, "UNKNOWN"],
      [200, { "content-type": "text/html" }, "INVALID_CONTENT_TYPE"],
    ] as const) {
      mockFetch({ status, rawBody: "x", headers });
      const error = (await feed.downloadFeedAttachmentFile("p", "a").catch((caught: unknown) => caught)) as { code: string };
      expect(error.code).toBe(code);
    }
  });

  it("downloads bug report attachments and fails on errors", async () => {
    mockFetch({ rawBody: "img", headers: { "content-type": "image/png", "content-disposition": "inline; filename*=UTF-8''captura%201.png" } });
    expect(await profile.downloadBugReportAttachment("b", "a")).toMatchObject({ fileName: "captura 1.png", mimeType: "image/png" });

    mockFetch({ status: 404, rawBody: "x" });
    await expect(profile.downloadBugReportAttachment("b", "a")).rejects.toThrow("404");

    mockFetch(okData({ bugReports: [{ id: "b1" }] }));
    expect(await profile.listMyBugReports()).toEqual([{ id: "b1" }]);

    mockFetch({ status: 500, body: {} });
    await expect(profile.listMyBugReports()).rejects.toThrow("500");
  });

  it("resolves attachment URLs against the API base and detects images", () => {
    expect(ateneo.resolveAteneoAttachmentUrl("/api/v1/ateneo/x")).toBe("http://api.test/api/v1/ateneo/x");
    expect(ateneo.isImageMimeType("image/heic")).toBe(true);
    expect(ateneo.isImageMimeType("application/pdf")).toBe(false);
  });
});

describe("enterprise API", () => {
  it("lists enterprises and fails loudly on errors", async () => {
    mockFetch(okData({ enterprises: [{ id: "e1" }] }));
    expect(await enterprise.listMyEnterprises()).toEqual([{ id: "e1" }]);
    expect(await enterprise.listVerifiedDirectory()).toEqual([{ id: "e1" }]);

    mockFetch({ status: 401, body: {} });
    await expect(enterprise.listMyEnterprises()).rejects.toThrow("401");
    await expect(enterprise.listVerifiedDirectory()).rejects.toThrow("401");
  });

  it("returns service results for mutations, including validation errors", async () => {
    mockFetch({ status: 201, body: { success: true, message: "ENTERPRISE_CREATED", data: { enterprise: { id: "e1" } } } });
    expect(await enterprise.createEnterprise({ companyName: "A", role: "B" })).toEqual({ success: true, message: "ENTERPRISE_CREATED", status: 201 });

    mockFetch({ status: 400, body: { success: false, message: "Validation failed" } });
    expect(await enterprise.createEnterprise({ companyName: "", role: "" })).toMatchObject({ success: false, status: 400 });
    expect(await enterprise.updateEnterprise("e1", { companyName: "", role: "" })).toMatchObject({ success: false, status: 400 });
    expect(await enterprise.deleteEnterprise("e1")).toMatchObject({ success: false, status: 400 });

    mockFetch(okData({ enterpriseId: "e1" }, "DELETED"));
    expect(await enterprise.updateEnterprise("e1", { companyName: "A", role: "B" })).toMatchObject({ success: true });
    expect(await enterprise.deleteEnterprise("e1")).toMatchObject({ success: true, message: "DELETED" });
  });
});

describe("admin API", () => {
  it("returns list items and surfaces backend error messages", async () => {
    mockFetch(okData({ items: [{ id: "1" }] }));
    expect(await admin.getCompaniesMembers()).toEqual([{ id: "1" }]);

    mockFetch({ status: 403, body: { success: false, message: "Insufficient permissions" } });
    await expect(admin.getCompaniesMembers()).rejects.toThrow("Insufficient permissions");

    mockFetch({ status: 502, rawBody: "gateway" });
    await expect(admin.getWhitelistedEmails()).rejects.toThrow("Respuesta inválida de emails whitelistados");
  });

  it("reads the companies membership state", async () => {
    const state = { hasBadge: false, hasOpenRequest: true, openRequestId: "r1", openRequestCreatedAt: "2026-01-01" };
    mockFetch(okData(state));
    expect(await admin.getCompaniesMembershipState()).toEqual(state);

    mockFetch({ status: 500, body: { success: false, message: "" } });
    await expect(admin.getCompaniesMembershipState()).rejects.toThrow();
  });

  it("exposes the access-check status as is", async () => {
    mockFetch({ status: 403, body: {} });
    expect(await admin.checkCompaniesAdminAccess()).toEqual({ status: 403 });
  });
});

describe("notification unread-count events", () => {
  it("broadcasts non-negative counts and ignores invalid ones", () => {
    const handler = vi.fn();
    const target = new EventTarget();
    vi.stubGlobal("window", target);

    const unsubscribe = notifications.onNotificationsUnreadCountUpdated(handler);
    notifications.emitNotificationsUnreadCountUpdated(3);
    notifications.emitNotificationsUnreadCountUpdated(-2);
    target.dispatchEvent(new Event("sophium:notifications-unread-count-updated"));
    target.dispatchEvent(new CustomEvent("sophium:notifications-unread-count-updated", { detail: "nope" }));

    expect(handler.mock.calls.map(([count]) => count)).toEqual([3, 0]);

    unsubscribe();
    notifications.emitNotificationsUnreadCountUpdated(5);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("is a no-op outside the browser", () => {
    vi.stubGlobal("window", undefined);
    expect(() => notifications.emitNotificationsUnreadCountUpdated(1)).not.toThrow();
    expect(notifications.onNotificationsUnreadCountUpdated(() => undefined)()).toBeUndefined();
  });
});
