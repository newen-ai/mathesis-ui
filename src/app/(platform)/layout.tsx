import { SessionGate } from "./_components/auth/SessionGate";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[color:color-mix(in_srgb,var(--line)_55%,transparent)] bg-[var(--surface)]/95 px-4 py-3 text-center text-xs text-[var(--text-secondary)] backdrop-blur-sm md:text-sm">
          Powered by Newen.solutions
        </footer>
      </div>
    </SessionGate>
  );
}
