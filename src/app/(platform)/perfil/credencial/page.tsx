"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../_components/TopBar";
import { DigitalCredentialCard } from "../../_components/home/DigitalCredentialCard";
import { navItems } from "../../_lib/constants";

export default function CredentialPage() {
  const { t } = useTranslation("profile");

  return (
    <>
      <TopBar navItems={navItems} />

      <main className="mx-auto flex min-h-[calc(100dvh-9.5rem)] w-full max-w-[1280px] justify-center px-4 pb-16 pt-10 md:px-6">
        <div className="w-full max-w-[640px]">
          <div className="mb-6 flex items-center gap-2 text-[0.96rem] font-medium text-[var(--text-primary)]">
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center text-[1.2rem] text-[var(--text-primary)]"
              aria-label={t("credential.backToProfileAria")}
            >
              ‹
            </Link>
            <Link href="/perfil" className="text-[var(--text-primary)] hover:text-[var(--brand-700)]">
              {t("credential.backToProfile")}
            </Link>
          </div>

          <DigitalCredentialCard />
        </div>
      </main>
    </>
  );
}
