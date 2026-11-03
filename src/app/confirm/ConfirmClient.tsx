"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getSessionAccessDecision } from "@/lib/api/auth";
import { verifyEmailOnce } from "./confirm-request-cache";
import { resolveConfirmAuthenticatedRedirect } from "./confirm-redirect";

type ConfirmClientProps = {
  token: string;
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
  const [isResolvingFallbackRedirect, setIsResolvingFallbackRedirect] = useState(false);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    const resolvedToken =
      token.trim() || new URLSearchParams(window.location.search).get("token")?.trim() || "";

    void verifyEmailOnce(resolvedToken).then((result) => {
      if (result.success) {
        setStatus("success");
        setServiceErrorMessage(null);
        return;
      }

      setIsResolvingFallbackRedirect(true);
      void getSessionAccessDecision()
        .then((accessDecision) => {
          const redirectTarget = resolveConfirmAuthenticatedRedirect(accessDecision);

          if (redirectTarget) {
            router.replace(redirectTarget);
            return;
          }

          setStatus("error");
          setServiceErrorMessage(result.message || null);
        })
        .catch(() => {
          setStatus("error");
          setServiceErrorMessage(result.message || null);
        })
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

  if (!hasMounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden="true" />
          <p className="sr-only" suppressHydrationWarning>
            {t("common.loading", { defaultValue: "Cargando..." })}
          </p>
        </section>
      </main>
    );
  }

  const message =
    status === "loading" || isResolvingFallbackRedirect
      ? t("confirm.loading")
      : status === "success"
      ? t("confirm.successMessage")
      : serviceErrorMessage || t("confirm.errorFallback");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          {t("confirm.eyebrow")}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          {status === "success" ? t("confirm.successTitle") : t("confirm.pendingTitle")}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        {status === "success" ? (
          <Link
            href="/bienvenida"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163a5b]"
          >
            {t("confirm.goToWelcome")}
          </Link>
        ) : null}
      </section>
    </main>
  );
}