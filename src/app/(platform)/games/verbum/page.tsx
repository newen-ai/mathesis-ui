import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";
import { VerbumGame } from "./_components/VerbumGame";

export default function VerbumTodayPage() {
  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <VerbumGame date={null} />
      </main>
    </div>
  );
}
