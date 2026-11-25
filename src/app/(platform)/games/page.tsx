import { TopBar } from "../_components/TopBar";
import { navItems } from "../_lib/constants";
import { GamesHub } from "./_components/GamesHub";

export default function GamesPage() {
  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <GamesHub />
      </main>
    </div>
  );
}
