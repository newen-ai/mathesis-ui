// What the browser says about the device, attached to bug reports so a device-specific bug can be reproduced.
// Best effort: user agents can lie, and iPadOS presents itself as a Mac (detected below via touch support).

export type DeviceType = "desktop" | "mobile" | "tablet";

export type DeviceInfo = {
  browser?: string;
  os?: string;
  deviceType?: DeviceType;
  screen?: string;
  viewport?: string;
  pixelRatio?: number;
  touch?: boolean;
  language?: string;
  timezone?: string;
  appVersion?: string;
};

type Environment = {
  userAgent: string;
  maxTouchPoints: number;
  screen?: { width: number; height: number };
  viewport?: { width: number; height: number };
  pixelRatio?: number;
  language?: string;
  timezone?: string;
  appVersion?: string;
};

function majorVersion(userAgent: string, pattern: RegExp): string {
  const match = userAgent.match(pattern);
  return match?.[1] ? ` ${match[1].split(".")[0]}` : "";
}

function detectBrowser(ua: string): string | undefined {
  // Order matters: Edge, Opera and Samsung include "Chrome", and Chrome includes "Safari".
  if (/Edg(e|A|iOS)?\//.test(ua)) return `Edge${majorVersion(ua, /Edg(?:e|A|iOS)?\/([\d.]+)/)}`;
  if (/OPR\/|Opera/.test(ua)) return `Opera${majorVersion(ua, /OPR\/([\d.]+)/)}`;
  if (/SamsungBrowser\//.test(ua)) return `Samsung Internet${majorVersion(ua, /SamsungBrowser\/([\d.]+)/)}`;
  if (/Firefox\/|FxiOS\//.test(ua)) return `Firefox${majorVersion(ua, /(?:Firefox|FxiOS)\/([\d.]+)/)}`;
  if (/Chrome\/|CriOS\//.test(ua)) return `Chrome${majorVersion(ua, /(?:Chrome|CriOS)\/([\d.]+)/)}`;
  if (/Safari\//.test(ua)) return `Safari${majorVersion(ua, /Version\/([\d.]+)/)}`;
  return undefined;
}

function detectOs(ua: string, isIpadAsMac: boolean): string | undefined {
  if (/iPhone|iPod/.test(ua)) return `iOS${majorVersion(ua, /OS (\d+)[_\d]* like Mac OS X/)}`;
  if (/iPad/.test(ua) || isIpadAsMac) return "iPadOS";
  if (/Android/.test(ua)) return `Android${majorVersion(ua, /Android ([\d.]+)/)}`;
  if (/Windows NT/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return undefined;
}

function detectDeviceType(ua: string, isIpadAsMac: boolean): DeviceType {
  if (/iPad|Tablet/.test(ua) || isIpadAsMac || (/Android/.test(ua) && !/Mobile/.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android/.test(ua)) return "mobile";
  return "desktop";
}

export function describeDevice(env: Environment): DeviceInfo {
  const ua = env.userAgent;
  // iPadOS Safari reports a Mac user agent; Macs have no touch screen.
  const isIpadAsMac = /Macintosh/.test(ua) && env.maxTouchPoints > 1;

  return {
    browser: detectBrowser(ua),
    os: detectOs(ua, isIpadAsMac),
    deviceType: detectDeviceType(ua, isIpadAsMac),
    screen: env.screen ? `${env.screen.width}x${env.screen.height}` : undefined,
    viewport: env.viewport ? `${env.viewport.width}x${env.viewport.height}` : undefined,
    pixelRatio: env.pixelRatio ? Math.round(env.pixelRatio * 100) / 100 : undefined,
    touch: env.maxTouchPoints > 0,
    language: env.language || undefined,
    timezone: env.timezone || undefined,
    appVersion: env.appVersion || undefined,
  };
}

export function collectDeviceInfo(): DeviceInfo | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }

  return describeDevice({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    screen: window.screen ? { width: window.screen.width, height: window.screen.height } : undefined,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    pixelRatio: window.devicePixelRatio,
    language: navigator.language,
    timezone,
    // Exposed by Vercel builds; empty locally.
    appVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
  });
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  desktop: "Escritorio",
  mobile: "Celular",
  tablet: "Tablet",
};

// One line for the form, e.g. "Chrome 131 · macOS · Escritorio · 1440×900".
export function formatDeviceSummary(info: DeviceInfo): string {
  return [
    info.browser,
    info.os,
    info.deviceType ? DEVICE_TYPE_LABELS[info.deviceType] : undefined,
    info.screen?.replace("x", "×"),
  ]
    .filter(Boolean)
    .join(" · ");
}
