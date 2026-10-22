"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { resolveEmailParam } from "@/lib/utils/email";

export default function RegistroEnviadoPage() {
  const { t } = useTranslation("auth");
  const searchParams = useSearchParams();
  const email = resolveEmailParam(searchParams.get("email") ?? undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#FAF8F5] px-6 py-16">
      <section className="w-full max-w-lg rounded-[32px] border border-[color:color-mix(in_srgb,var(--line)_55%,transparent)] bg-[var(--surface)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(10,37,64,0.08)]">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
          {t("registerSent.eyebrow")}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-spectral)] text-3xl font-bold leading-tight text-[var(--text-primary)]">
          {t("registerSent.title")}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          {email ? (
            <>
              {t("registerSent.descriptionWithEmail", { email })}
            </>
          ) : (
            <>{t("registerSent.descriptionWithoutEmail")}</>
          )}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t("registerSent.goToLogin")}
          </Link>
        </div>
      </section>
    </main>
  );
}