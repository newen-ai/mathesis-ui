"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import i18next from "@/lib/i18n";

type AppLanguage = "es" | "en";

const LANGUAGE_STORAGE_KEY = "sophium-ui-language";

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/registro",
  "/forgot-password",
  "/reset-password",
  "/confirm",
  "/unverified",
  "/whitelist-access",
];

function normalizeAppLanguage(value?: string | null): AppLanguage {
  if (typeof value !== "string") {
    return "es";
  }

  return value.trim().toLowerCase().startsWith("en") ? "en" : "es";
}

function isAuthRoute(pathname: string): boolean {
  const normalizedPathname = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  return AUTH_ROUTE_PREFIXES.some((prefix) => {
    if (normalizedPathname === prefix) {
      return true;
    }

    return normalizedPathname.startsWith(`${prefix}/`);
  });
}

export function AuthLanguageSwitcher() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() =>
    normalizeAppLanguage(i18next.language)
  );

  const showSwitcher = useMemo(() => isAuthRoute(pathname), [pathname]);

  useEffect(() => {
    const onLanguageChanged = (nextLanguage: string) => {
      setAppLanguage(normalizeAppLanguage(nextLanguage));
    };

    i18next.on("languageChanged", onLanguageChanged);

    return () => {
      i18next.off("languageChanged", onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!panelRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const onLanguageSelect = (nextLanguage: AppLanguage) => {
    if (nextLanguage === appLanguage) {
      setIsOpen(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }

    setAppLanguage(nextLanguage);
    void i18next.changeLanguage(nextLanguage);
    setIsOpen(false);
  };

  if (!showSwitcher) {
    return null;
  }

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-[140] md:right-6 md:top-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_6px_18px_color-mix(in_srgb,var(--navy-900)_16%,transparent)] transition hover:bg-[var(--surface-2)]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Cambiar idioma"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.3 4 5.6 4 9s-1.5 6.7-4 9" />
          <path d="M12 3c-2.5 2.3-4 5.6-4 9s1.5 6.7 4 9" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_12px_28px_color-mix(in_srgb,var(--navy-900)_20%,transparent)]"
        >
          <button
            type="button"
            role="menuitemradio"
            aria-checked={appLanguage === "es"}
            onClick={() => onLanguageSelect("es")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
              appLanguage === "es"
                ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span>Español</span>
            {appLanguage === "es" ? <span aria-hidden="true">✓</span> : null}
          </button>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={appLanguage === "en"}
            onClick={() => onLanguageSelect("en")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
              appLanguage === "en"
                ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span>English</span>
            {appLanguage === "en" ? <span aria-hidden="true">✓</span> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
