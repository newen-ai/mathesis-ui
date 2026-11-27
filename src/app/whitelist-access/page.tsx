"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getSessionAccessDecision, logout } from "@/lib/api/auth";
import { withBasePath } from "@/lib/assets";
import { HOME_PATH } from "@/lib/routes";
import { useHasMounted } from "@/lib/utils/use-has-mounted";

// Beta sign-up form. People are matched by hand against their account (same name, last name and email).
const BETA_SIGNUP_FORM_URL = "https://forms.gle/Zgea5DVsMqQfHDrWA";
const CONTACT_EMAIL = "contact@sophium.social";
const NEXT_STEPS = ["nextStep1", "nextStep2", "nextStep3"] as const;

// Shown to signed-in accounts whose email is not on the whitelist yet (after confirming the email).
export default function WhitelistAccessPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Someone who was already let in (or whose session ended) does not belong on this page.
  useEffect(() => {
    let isActive = true;
    void getSessionAccessDecision().then((decision) => {
      if (!isActive) return;
      if (decision.sessionState === "unauthenticated") {
        router.replace("/login");
      } else if (decision.sessionState === "authenticated" && (decision.isWhitelisted || decision.role === "admin")) {
        router.replace(HOME_PATH);
      }
    });
    return () => {
      isActive = false;
    };
  }, [router]);

  const onLogout = async () => {
    setIsLoggingOut(true);
    const result = await logout();
    if (!result.success) {
      toast.warning(t("whitelist.logoutError"));
    }
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-[var(--navy-900)] px-4 pb-12 pt-8 md:pt-10">
      <div className="mx-auto flex w-full max-w-[45rem] flex-col items-center">
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath("/brand/sophium-symbol-gold-realista.png")}
            alt=""
            width={158}
            height={256}
            className="h-20 w-auto md:h-[6.25rem]"
            draggable={false}
          />
          <span className="font-display text-[1.35rem] leading-none text-[var(--brand-300)]">Sophium</span>
        </div>

        {/* Copy depends on the stored language, so it renders after hydration (the server always renders Spanish). */}
        <section className="mt-7 w-full rounded-[1.25rem] bg-[var(--surface-2)] px-6 py-8 md:px-11 md:py-10">
          {hasMounted ? (
            <>
              <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--success-500)]">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--success-500)]" />
                {t("whitelist.eyebrow")}
              </p>
              <h1 className="mt-5 font-display text-[1.75rem] font-normal leading-tight sophium-heading-primary md:text-[2.15rem]">
                {t("whitelist.title")}
              </h1>
              <p className="mt-5 text-[0.98rem] leading-relaxed text-[var(--text-primary)] opacity-85">
                {t("whitelist.description")}
              </p>

              <a
                href={BETA_SIGNUP_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center rounded-[0.6rem] bg-[var(--navy-900)] px-6 py-4 text-base font-semibold text-[var(--brand-300)] transition hover:bg-[var(--navy-800)]"
              >
                {t("whitelist.formButton")}
              </a>

              <div className="mt-6 rounded-xl border-[1.5px] border-[var(--brand-500)] bg-[var(--brand-50)] px-5 py-4 text-[0.92rem] leading-relaxed sophium-heading-primary">
                <strong className="font-bold">{t("whitelist.importantLabel")}</strong> {t("whitelist.importantText")}
              </div>

              <h2 className="mt-7 font-display text-[1.3rem] font-normal sophium-heading-primary">{t("whitelist.nextTitle")}</h2>
              <ol className="mt-3 space-y-3">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-xs font-bold text-[var(--brand-300)]"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-[0.95rem] leading-relaxed text-[var(--text-primary)] opacity-85">
                      {t(`whitelist.${step}`)}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {t("whitelist.questions")}{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold sophium-heading-primary hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  disabled={isLoggingOut}
                  className="self-start font-semibold underline underline-offset-2 sophium-heading-primary disabled:cursor-not-allowed disabled:opacity-70 sm:self-auto"
                >
                  {isLoggingOut ? t("whitelist.loggingOut") : t("whitelist.logout")}
                </button>
              </div>
            </>
          ) : (
            <div className="min-h-[34rem]" aria-busy="true" />
          )}
        </section>
      </div>
    </main>
  );
}
