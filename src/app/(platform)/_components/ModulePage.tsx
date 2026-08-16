import { ReactNode } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { catchyLines, navItems } from "../_lib/constants";
import { TopBar } from "./TopBar";
import { CatchyPhrasesBanner } from "./home/CatchyPhrasesBanner";

type ModulePageProps = {
  title: string;
  subtitle: string;
  subtitleClassName?: string;
  children: ReactNode;
};

export function ModulePage({ title, subtitle, subtitleClassName, children }: ModulePageProps) {
  return (
    <div className="mathesis-shell min-h-screen">
      <TopBar navItems={navItems} />
      <CatchyPhrasesBanner lines={catchyLines} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <AppCard className="p-5 sm:p-6">
          <h1 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className={subtitleClassName ?? "mt-1 text-sm text-slate-600"}>{subtitle}</p>
        </AppCard>

        <section className="mt-4 space-y-4">{children}</section>
      </main>
    </div>
  );
}
