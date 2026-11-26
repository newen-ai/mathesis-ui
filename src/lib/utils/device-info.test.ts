import { describe, expect, it } from "vitest";
import { describeDevice, formatDeviceSummary } from "./device-info";

const base = { maxTouchPoints: 0, screen: { width: 1440, height: 900 } };

describe("describeDevice", () => {
  it("detects desktop Chrome on macOS", () => {
    const info = describeDevice({
      ...base,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.86 Safari/537.36",
    });
    expect(info).toMatchObject({ browser: "Chrome 131", os: "macOS", deviceType: "desktop", touch: false });
    expect(formatDeviceSummary(info)).toBe("Chrome 131 · macOS · Escritorio · 1440×900");
  });

  it("detects Safari on iPhone", () => {
    const info = describeDevice({
      maxTouchPoints: 5,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    });
    expect(info).toMatchObject({ browser: "Safari 18", os: "iOS 18", deviceType: "mobile", touch: true });
  });

  it("detects an iPad that presents itself as a Mac", () => {
    const info = describeDevice({
      maxTouchPoints: 5,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    });
    expect(info).toMatchObject({ os: "iPadOS", deviceType: "tablet" });
  });

  it("detects Edge on Windows and Chrome on Android phones", () => {
    expect(
      describeDevice({
        ...base,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70",
      })
    ).toMatchObject({ browser: "Edge 131", os: "Windows", deviceType: "desktop" });

    expect(
      describeDevice({
        maxTouchPoints: 5,
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      })
    ).toMatchObject({ browser: "Chrome 131", os: "Android 14", deviceType: "mobile" });
  });
});
