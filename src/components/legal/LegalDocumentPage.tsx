"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BrandCornerLogo } from "@/components/ui/BrandCornerLogo";
import { useHasMounted } from "@/lib/utils/use-has-mounted";
import { formatLegalVersionDate, LEGAL_PAGE_PATHS, type LegalDocumentSlug } from "@/lib/api/legal";
import { LegalMarkdown } from "./LegalMarkdown";
import { useLegalDocuments } from "./useLegalDocuments";

// Public page (no session needed): the texts must be readable before registering.
export function LegalDocumentPage({ slug }: { slug: LegalDocumentSlug }) {
  const { t, i18n } = useTranslation("common");
  const { status, documents, reload } = useLegalDocuments([slug]);
  const document = documents?.[slug];
  const otherSlug: LegalDocumentSlug = slug === "terms" ? "privacy" : "terms";
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    // Same empty shell on the server and in the first client render: the copy depends on the stored language.
    return (
      <main className="sophium-shell relative min-h-screen px-4 pb-16 pt-20 md:pt-28">
        <BrandCornerLogo />
        <div className="mx-auto w-full max-w-3xl">
          <div className="sophium-card mt-10 min-h-[16rem]" aria-busy="true" />
        </div>
      </main>
    );
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  };

  return (
    <main className="sophium-shell relative min-h-screen px-4 pb-16 pt-20 md:pt-28">
      <BrandCornerLogo />
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-1 text-scale-2 font-semibold sophium-link-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {t("legal.back")}
        </button>

        <article className="sophium-card px-5 py-7 md:px-10 md:py-10">
          {status === "loading" ? (
            <p className="text-scale-3 text-[var(--text-secondary)]">{t("legal.loading")}</p>
          ) : null}

          {status === "error" ? (
            <div className="space-y-3">
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

          {document ? (
            <>
              <header className="border-b border-[var(--line)] pb-5">
                <h1 className="font-display text-scale-5 font-semibold leading-tight sophium-heading-primary">
                  {document.title}
                </h1>
                <p className="mt-2 text-scale-2 text-[var(--text-soft)]">
                  {t("legal.lastUpdated", { date: formatLegalVersionDate(document.version, i18n.language) })}
                </p>
                {t("legal.spanishOnly") ? (
                  <p className="mt-1 text-scale-2 text-[var(--text-soft)]">{t("legal.spanishOnly")}</p>
                ) : null}
              </header>
              <div className="pt-2">
                <LegalMarkdown markdown={document.markdown} />
              </div>
              <footer className="mt-8 border-t border-[var(--line)] pt-5">
                <Link href={LEGAL_PAGE_PATHS[otherSlug]} className="text-scale-2 font-semibold sophium-link-accent hover:underline">
                  {otherSlug === "privacy" ? t("legal.seeAlsoPrivacy") : t("legal.seeAlsoTerms")}
                </Link>
              </footer>
            </>
          ) : null}
        </article>
      </div>
    </main>
  );
}
