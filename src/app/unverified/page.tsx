"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { requestVerificationEmail } from "@/lib/api/auth";
import { getAuthErrorTranslation } from "@/lib/i18n/auth-errors";
import { maskEmailForDisplay, normalizeEmailInput } from "@/lib/utils/email";

const COOLDOWN_MS = 3 * 60 * 1000;

function getCooldownStorageKey(email: string): string {
  return `verification-resend-cooldown:${email}`;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function extractRetryAfterSeconds(details: unknown): number | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const value = (details as { retryAfterSeconds?: unknown }).retryAfterSeconds;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.ceil(value);
}

export default function UnverifiedPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => normalizeEmailInput(searchParams.get("email")), [searchParams]);
  const maskedEmail = useMemo(
    () => (email ? maskEmailForDisplay(email) : t("unverified.fallbackMaskedEmail")),
    [email, t]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      router.replace("/login");
      return;
    }

    const storedValue = window.localStorage.getItem(getCooldownStorageKey(email));
    if (!storedValue) {
      return;
    }

    const parsed = Number.parseInt(storedValue, 10);
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      const timeoutId = window.setTimeout(() => {
        setCooldownUntil(parsed);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    window.localStorage.removeItem(getCooldownStorageKey(email));
  }, [email, router]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const canResend = !isSubmitting && remainingSeconds === 0;

  const handleResend = async () => {
    if (!email || !canResend) {
      return;
    }

    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    const result = await requestVerificationEmail({ email });

    if (!result.success) {
      const retryAfterSeconds = extractRetryAfterSeconds(result.details);
      if (retryAfterSeconds) {
        const nextCooldownUntil = Date.now() + retryAfterSeconds * 1000;
        setCooldownUntil(nextCooldownUntil);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            getCooldownStorageKey(email),
            String(nextCooldownUntil)
          );
        }
      }

      setError(getAuthErrorTranslation(result.details, result.message));
      setIsSubmitting(false);
      return;
    }

    const nextCooldownUntil = Date.now() + COOLDOWN_MS;
    setCooldownUntil(nextCooldownUntil);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getCooldownStorageKey(email), String(nextCooldownUntil));
    }

    setFeedback(t("unverified.feedbackSent"));
    setIsSubmitting(false);
  };

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <section className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="px-8 pb-10 pt-9 lg:hidden" style={{ backgroundColor: "var(--navy-900)" }}>
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}
            className="inline-flex text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C] transition hover:opacity-80"
          >
            {t("unverified.back")}
          </Link>
          <h1 className="mt-3 font-[family-name:Georgia] text-[1.35rem] font-bold leading-[1.08] text-[#FAF8F5]">
            {t("unverified.mobileTitle")}
          </h1>
          <div className="mt-6 h-1 w-full rounded-full bg-[#C9A84C]" />
        </div>

        <div
          className="relative hidden overflow-hidden text-center lg:flex lg:w-2/5 lg:shrink-0 lg:flex-col lg:justify-between lg:px-12 lg:py-14 lg:text-left"
          style={{ backgroundColor: "var(--navy-900)" }}
        >
          <div className="relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_SRC}
              alt={t("common.brandLogoAlt")}
              width={40}
              height={40}
              loading="eager"
              decoding="async"
              className="mx-auto h-16 w-16 lg:mx-0 lg:h-9 lg:w-9"
            />
            <p className="mt-2 font-[family-name:Georgia] text-xl font-bold tracking-[0.1em] text-[#FAF8F5] lg:mt-0">
              Sophium
            </p>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C]">
              {t("unverified.desktopEyebrow")}
            </p>
            <h1 className="mt-4 font-[family-name:Georgia] text-[2.2rem] font-bold leading-tight text-[#FAF8F5] lg:max-w-[360px] lg:text-[3.15rem] lg:leading-[1.08]">
              {t("unverified.desktopTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-[370px] font-[family-name:Georgia] text-base italic leading-relaxed text-[#D7DCE3] lg:mx-0 lg:max-w-xs lg:text-sm">
              {t("unverified.desktopDescription")}
            </p>
          </div>

          <p className="relative z-10 mt-10 text-[0.66rem] text-[#8EA0B6] lg:mt-0">sophium.social</p>
        </div>

        <div
          className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:justify-center lg:px-14 lg:py-14"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="w-full lg:mx-auto lg:max-w-[440px]">
            <h2
              className="font-[family-name:Georgia] text-[1.35rem] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("unverified.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {t("unverified.description", { email: maskedEmail })}
            </p>

            {feedback ? (
              <p
                className="mt-4 rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "color-mix(in srgb, var(--success-500, #16a34a) 35%, transparent)",
                  color: "var(--text-primary)",
                  backgroundColor: "color-mix(in srgb, var(--success-500, #16a34a) 10%, transparent)",
                }}
              >
                {feedback}
              </p>
            ) : null}

            {error ? (
              <p
                className="mt-4 rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "color-mix(in srgb, var(--danger-500, #dc2626) 35%, transparent)",
                  color: "var(--text-primary)",
                  backgroundColor: "color-mix(in srgb, var(--danger-500, #dc2626) 10%, transparent)",
                }}
              >
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--brand-500)" }}
              >
                {isSubmitting
                  ? t("unverified.resending")
                  : remainingSeconds > 0
                    ? t("unverified.resendIn", { countdown: formatCountdown(remainingSeconds) })
                    : t("unverified.resendNow")}
              </button>

              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="inline-flex w-full items-center justify-center rounded-full border px-6 py-3 text-sm font-bold transition hover:opacity-85"
                style={{
                  color: "var(--text-primary)",
                  borderColor: "var(--border-strong, var(--border-subtle))",
                  backgroundColor: "var(--surface)",
                }}
              >
                {t("unverified.backToLogin")}
              </Link>
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-soft)" }}>
              {t("unverified.cooldownHint")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
