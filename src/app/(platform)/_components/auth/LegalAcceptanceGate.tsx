"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandCornerLogo } from "@/components/ui/BrandCornerLogo";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import { useLegalDocuments } from "@/components/legal/useLegalDocuments";
import { logout } from "@/lib/api/auth";
import { acceptLegalDocuments, formatLegalVersionDate, LEGAL_PAGE_PATHS, type LegalDocumentSlug } from "@/lib/api/legal";

const SLUGS: LegalDocumentSlug[] = ["terms", "privacy"];

type LegalAcceptanceGateProps = {
  onAccepted: () => void;
};

// Blocking screen for signed-in users who have not accepted the current Terms and Privacy Policy versions.
export function LegalAcceptanceGate({ onAccepted }: LegalAcceptanceGateProps) {
  const { t, i18n } = useTranslation("common");
  const { status, documents, reload } = useLegalDocuments(SLUGS);
  const [openSlug, setOpenSlug] = useState<LegalDocumentSlug | null>(null);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!documents || !checked || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await acceptLegalDocuments({
        termsVersion: documents.terms.version,
        privacyVersion: documents.privacy.version,
      });
      onAccepted();
    } catch (caught) {
      const code = (caught as { details?: { code?: string } }).details?.code;
      if (code === "LEGAL_VERSION_OUTDATED") {
        // A new version was published while the screen was open: show the new texts and ask again.
        setChecked(false);
        setOpenSlug(null);
        reload();
        setError(t("legal.gate.outdated"));
      } else {
        setError(t("legal.gate.acceptError"));
      }
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.replace("/login");
  };

  return (
    <main className="sophium-shell relative flex min-h-screen items-start justify-center px-4 pb-12 pt-20 md:items-center md:pt-24">
      <BrandCornerLogo />
      <section className="sophium-card w-full max-w-2xl px-5 py-6 md:px-8 md:py-8" aria-labelledby="legal-gate-title">
        <h1 id="legal-gate-title" className="font-display text-scale-5 font-semibold leading-tight sophium-heading-primary">
          {t("legal.gate.title")}
        </h1>
        <p className="mt-2 text-scale-3 text-[var(--text-secondary)]">
          {t("legal.gate.intro")}
        </p>

        {status === "loading" ? <p className="mt-5 text-scale-3 text-[var(--text-secondary)]">{t("legal.loading")}</p> : null}

        {status === "error" ? (
          <div className="mt-5 space-y-3">
            <p className="text-scale-3 text-[var(--text-secondary)]">{t("legal.loadError")}</p>
            <button
              type="button"
              onClick={reload}
              className="rounded-full bg-[var(--brand-500)] px-5 py-2 text-scale-2 font-semibold sophium-on-brand transition hover:brightness-95"
            >
              {t("legal.retry")}
            </button>
          </div>
        ) : null}

        {documents ? (
          <ul className="mt-5 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
            {SLUGS.map((slug) => {
              const document = documents[slug];
              const isOpen = openSlug === slug;
              return (
                <li key={slug} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-scale-3 font-semibold text-[var(--text-primary)]">{document.title}</p>
                      <p className="text-scale-1 text-[var(--text-soft)]">
                        {t("legal.lastUpdated", { date: formatLegalVersionDate(document.version, i18n.language) })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={LEGAL_PAGE_PATHS[slug]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-scale-2 font-semibold sophium-link-accent hover:underline"
                      >
                        {t("legal.gate.openInNewTab")}
                      </a>
                      <button
                        type="button"
                        onClick={() => setOpenSlug(isOpen ? null : slug)}
                        aria-expanded={isOpen}
                        aria-controls={`legal-gate-${slug}`}
                        className="rounded-full border border-[var(--line)] px-4 py-1.5 text-scale-2 font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand-300)]"
                      >
                        {isOpen ? t("legal.gate.hide") : t("legal.gate.read")}
                      </button>
                    </div>
                  </div>
                  {isOpen ? (
                    <div
                      id={`legal-gate-${slug}`}
                      className="mt-3 max-h-[45vh] overflow-y-auto rounded-xl bg-[var(--surface-2)] px-4 pb-4"
                    >
                      <LegalMarkdown markdown={document.markdown} openLinksInNewTab />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        <label className="mt-5 flex items-start gap-2 text-scale-3 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-500)]"
            checked={checked}
            disabled={!documents}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <span>{t("legal.gate.checkbox")}</span>
        </label>

        {error ? (
          <p role="alert" className="mt-3 text-scale-2 font-medium text-[var(--danger-500)]">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-scale-2 font-semibold text-[var(--text-secondary)] hover:underline"
          >
            {t("legal.gate.logout")}
          </button>
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={!documents || !checked || isSubmitting}
            className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold sophium-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("legal.gate.accepting") : t("legal.gate.accept")}
          </button>
        </div>
      </section>
    </main>
  );
}
