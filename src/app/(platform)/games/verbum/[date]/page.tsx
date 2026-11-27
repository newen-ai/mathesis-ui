import { TopBar } from "../../../_components/TopBar";
import { navItems } from "../../../_lib/constants";
import { VerbumGame } from "../_components/VerbumGame";

type VerbumDayPageProps = {
  params: Promise<{ date: string }>;
};

// Past day from the calendar or a shared link (/games/verbum/2026-11-24). The backend decides whether
// that day is playable (launch to today) and the game shows a friendly message otherwise.
export default async function VerbumDayPage({ params }: VerbumDayPageProps) {
  const { date } = await params;

  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <VerbumGame date={decodeURIComponent(date)} />
      </main>
    </div>
  );
}
