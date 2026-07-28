import { AppCard } from "@/components/ui/AppCard";

type RightSidebarProps = {
  professionalStampLines: string[];
};

export function RightSidebar({ professionalStampLines }: RightSidebarProps) {
  return (
    <aside className="mensa-fade-up hidden space-y-4 lg:sticky lg:top-24 lg:block">
      <AppCard className="p-6">
        <h3 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-[var(--navy-900)]">
          ∫ Mathesis
        </h3>
        <p className="mt-4 text-lg leading-snug text-[var(--text-primary)]">
          Directorio de empresas y feed profesional para miembros con negocio propio.
        </p>

        <button
          type="button"
          className="mt-6 rounded-full bg-[var(--brand-500)] px-6 py-3 text-base font-semibold text-[var(--navy-900)] transition hover:brightness-95"
        >
          Solicitar membresia
        </button>

        <ul className="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
          {professionalStampLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </AppCard>
    </aside>
  );
}
