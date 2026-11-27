"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getSessionAccessDecision, requestVerificationEmailByToken } from "@/lib/api/auth";
import { extractAuthErrorCode } from "@/lib/i18n/auth-errors";
import { verifyEmailOnce } from "./confirm-request-cache";
import { resolveConfirmAuthenticatedRedirect } from "./confirm-redirect";

type ConfirmClientProps = {
  token: string;
};

type ResendState = "idle" | "sending" | "sent" | "rateLimited" | "failed";

const TOKEN_EXPIRED_CODE = "EMAIL_VERIFICATION_TOKEN_EXPIRED";
const TOKEN_INVALID_CODE = "EMAIL_VERIFICATION_TOKEN_INVALID";
const RATE_LIMITED_CODE = "VERIFICATION_EMAIL_RATE_LIMITED";

function resolveConfirmToken(token: string): string {
  return token.trim() || new URLSearchParams(window.location.search).get("token")?.trim() || "";
}

const noticeStyle = (tone: "success" | "danger") => {
  const color = tone === "success" ? "var(--success-500, #16a34a)" : "var(--danger-500)";
  return {
    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
    color: "var(--text-primary)",
  };
};

export function ConfirmClient({ token }: ConfirmClientProps) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [serviceErrorMessage, setServiceErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [isResolvingFallbackRedirect, setIsResolvingFallbackRedirect] = useState(false);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    void verifyEmailOnce(resolveConfirmToken(token)).then((result) => {
      if (result.success) {
        setStatus("success");
        setServiceErrorMessage(null);
        setErrorCode(undefined);
        return;
      }

      const showError = () => {
        setStatus("error");
        setServiceErrorMessage(result.message || null);
        setErrorCode(extractAuthErrorCode(result.details));
      };

      setIsResolvingFallbackRedirect(true);
      void getSessionAccessDecision()
        .then((accessDecision) => {
          const redirectTarget = resolveConfirmAuthenticatedRedirect(accessDecision);

          if (redirectTarget) {
            router.replace(redirectTarget);
            return;
          }

          showError();
        })
        .catch(showError)
        .finally(() => {
          setIsResolvingFallbackRedirect(false);
        });
    });
  }, [hasMounted, router, token]);

  useEffect(() => {
    if (!hasMounted || status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/bienvenida");
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasMounted, router, status]);

  const handleResend = async () => {
    const resolvedToken = resolveConfirmToken(token);
    if (!resolvedToken || resendState === "sending" || resendState === "sent") {
      return;
    }

    setResendState("sending");
    const result = await requestVerificationEmailByToken(resolvedToken);

    if (result.success) {
      setResendState("sent");
      return;
    }

    setResendState(extractAuthErrorCode(result.details) === RATE_LIMITED_CODE ? "rateLimited" : "failed");
  };

  if (!hasMounted) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6 py-12"
        style={{ backgroundColor: "var(--background)" }}
      >
        <section
          className="w-full max-w-md rounded-3xl border p-8 text-center shadow-sm"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div
            className="mx-auto h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--line)", borderTopColor: "var(--text-secondary)" }}
            aria-hidden="true"
          />
          <p className="sr-only" suppressHydrationWarning>
            {t("common.loading", { defaultValue: "Cargando..." })}
          </p>
        </section>
      </main>
    );
  }

  const isTokenExpired = status === "error" && errorCode === TOKEN_EXPIRED_CODE;
  const isTokenInvalid = status === "error" && errorCode === TOKEN_INVALID_CODE;

  const message =
    status === "loading" || isResolvingFallbackRedirect
      ? t("confirm.loading")
      : status === "success"
      ? t("confirm.successMessage")
      : isTokenExpired
      ? t("confirm.expiredMessage")
      : isTokenInvalid
      ? t("confirm.invalidMessage")
      : serviceErrorMessage || t("confirm.errorFallback");

  const title =
    status === "success"
      ? t("confirm.successTitle")
      : isTokenExpired
      ? t("confirm.expiredTitle")
      : t("confirm.pendingTitle");

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <section
        className="w-full max-w-md rounded-3xl border p-8 shadow-sm"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--line)" }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--text-soft)" }}
        >
          {t("confirm.eyebrow")}
        </p>
        <h1 className="sophium-heading-primary mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>

        {status === "success" ? (
          <Link
            href="/bienvenida"
            className="sophium-on-brand mt-6 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95"
            style={{ backgroundColor: "var(--brand-500)" }}
          >
            {t("confirm.goToWelcome")}
          </Link>
        ) : null}

        {isTokenExpired && resendState === "sent" ? (
          <p className="mt-4 rounded-lg border px-3 py-2 text-xs font-semibold" style={noticeStyle("success")}>
            {t("confirm.resendSent")}
          </p>
        ) : null}

        {isTokenExpired && (resendState === "rateLimited" || resendState === "failed") ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={noticeStyle("danger")}
          >
            {resendState === "rateLimited" ? t("verificationEmailRateLimited") : t("confirm.resendFailed")}
          </p>
        ) : null}

        {status === "error" && !isResolvingFallbackRedirect ? (
          <div className="mt-6 flex flex-col gap-3">
            {isTokenExpired && resendState !== "sent" ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === "sending"}
                className="sophium-on-brand inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--brand-500)" }}
              >
                {resendState === "sending" ? t("confirm.resending") : t("confirm.resendNow")}
              </button>
            ) : null}

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border px-6 py-3 text-sm font-bold transition hover:opacity-85"
              style={{
                color: "var(--text-primary)",
                borderColor: "var(--line-strong)",
                backgroundColor: "var(--surface)",
              }}
            >
              {t("confirm.goToLogin")}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
