"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

// Cloudflare Turnstile (CAPTCHA) widget: https://developers.cloudflare.com/turnstile/
// Off while NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset. Local and test environments use Cloudflare's public test
// site key 1x00000000000000000000AA (always passes). The token is single-use: remount the widget (change its
// `key`) after every submit so the next attempt gets a fresh one.

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme?: "auto" | "light" | "dark";
      language?: string;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function isTurnstileEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load")));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type TurnstileWidgetProps = {
  // Called with a fresh token, or with null when it expires or the check fails.
  onToken: (token: string | null) => void;
  language?: string;
  className?: string;
};

export function TurnstileWidget({ onToken, language, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const emitToken = useEffectEvent((token: string | null) => onToken(token));

  useEffect(() => {
    if (!isTurnstileEnabled() || !containerRef.current) {
      return;
    }

    let widgetId: string | null = null;
    let cancelled = false;
    const container = containerRef.current;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId = turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => emitToken(token),
          "expired-callback": () => emitToken(null),
          "error-callback": () => emitToken(null),
          theme: "auto",
          language
        });
      })
      .catch(() => emitToken(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [language]);

  if (!isTurnstileEnabled()) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}

export type TurnstileState = {
  enabled: boolean;
  // Current token, null until the widget passes (or after it expires).
  token: string | null;
  // The widget to place in the form (null when Turnstile is off).
  widget: ReactNode;
  // Tokens are single-use: call after every submit to get a fresh widget and token.
  reset: () => void;
};

// Form-level helper: owns the token and remounts the widget on reset.
export function useTurnstile(className?: string): TurnstileState {
  const { i18n } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const enabled = isTurnstileEnabled();

  const reset = useCallback(() => {
    setToken(null);
    setWidgetKey((value) => value + 1);
  }, []);

  const widget = enabled ? (
    <TurnstileWidget key={widgetKey} onToken={setToken} language={i18n.language} className={className} />
  ) : null;

  return { enabled, token, widget, reset };
}
