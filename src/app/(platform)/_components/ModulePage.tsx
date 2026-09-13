import { ReactNode } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { navItems } from "../_lib/constants";
import { TopBar } from "./TopBar";

type ModulePageProps = {
  title: string;
  subtitle: string;
  subtitleClassName?: string;
  hideHeader?: boolean;
  lockDesktopScroll?: boolean;
  children: ReactNode;
};

export function ModulePage({
  title,
  subtitle,
  subtitleClassName,
  hideHeader = false,
  lockDesktopScroll = false,
  children,
}: ModulePageProps) {
  const rootClassName = lockDesktopScroll
    ? "mathesis-shell min-h-screen md:flex md:h-[calc(100dvh-2.75rem)] md:min-h-[calc(100dvh-2.75rem)] md:flex-col md:overflow-hidden"
    : "mathesis-shell min-h-screen";
  const mainClassName = lockDesktopScroll
    ? "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden"
    : "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8";
  const sectionClassName = `${hideHeader ? "mt-0" : "mt-4"} space-y-4${
    lockDesktopScroll ? " md:flex md:flex-1 md:min-h-0 md:flex-col md:overflow-hidden" : ""
  }`;

  return (
    <div className={rootClassName}>
      <TopBar navItems={navItems} />
      <main className={mainClassName}>
        {!hideHeader ? (
          <AppCard className="p-5 sm:p-6">
            <h1 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className={subtitleClassName ?? "mt-1 text-sm text-slate-600"}>{subtitle}</p>
          </AppCard>
        ) : null}

        <section className={sectionClassName}>{children}</section>
      </main>
    </div>
  );
}
