import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyEmailMock = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  verifyEmail: (token: string) => verifyEmailMock(token),
}));

import {
  clearVerifyEmailOnceCache,
  verifyEmailOnce,
} from "./confirm-request-cache";

describe("verifyEmailOnce", () => {
  beforeEach(() => {
    clearVerifyEmailOnceCache();
    verifyEmailMock.mockReset();
  });

  it("returns validation error when token is empty", async () => {
    const result = await verifyEmailOnce("   ");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Verification token is required");
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it("calls verifyEmail only once for repeated calls with the same token", async () => {
    verifyEmailMock.mockResolvedValue({ success: true, message: "EMAIL_VERIFIED" });

    const firstRequest = verifyEmailOnce("abc-token");
    const secondRequest = verifyEmailOnce("abc-token");

    const [firstResult, secondResult] = await Promise.all([firstRequest, secondRequest]);

    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({ success: true, message: "EMAIL_VERIFIED" });
    expect(secondResult).toEqual({ success: true, message: "EMAIL_VERIFIED" });
  });

  it("normalizes surrounding whitespace for cache key", async () => {
    verifyEmailMock.mockResolvedValue({ success: true, message: "EMAIL_VERIFIED" });

    await Promise.all([
      verifyEmailOnce("  same-token  "),
      verifyEmailOnce("same-token"),
    ]);

    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
    expect(verifyEmailMock).toHaveBeenCalledWith("same-token");
  });
});
