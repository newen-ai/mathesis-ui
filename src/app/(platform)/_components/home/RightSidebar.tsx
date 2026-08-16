import { AppCard } from "@/components/ui/AppCard";

type MembershipCtaVariant = "brand" | "danger";

type RightSidebarProps = {
  professionalStampLines: string[];
  membershipCtaLabel: string;
  membershipCtaVariant: MembershipCtaVariant;
  isMembershipCtaDisabled: boolean;
  onMembershipCtaClick: () => void;
};

export function RightSidebar({
  professionalStampLines,
  membershipCtaLabel,
  membershipCtaVariant,
  isMembershipCtaDisabled,
  onMembershipCtaClick,
}: RightSidebarProps) {
  const membershipCtaClassName =
    membershipCtaVariant === "danger"
      ? "mt-6 rounded-full bg-[var(--danger-500)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--danger-400)]"
      : "mt-6 rounded-full bg-[var(--brand-500)] px-6 py-3 text-base font-semibold text-[var(--navy-900)] transition hover:brightness-95";

  return (
    <aside className="mathesis-fade-up hidden space-y-4 lg:sticky lg:top-24 lg:block">
      <AppCard className="p-6">
        <h3 className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-[var(--navy-900)]">
          ∫ Mathesis
        </h3>
        <p className="mt-4 text-lg leading-snug text-[var(--text-primary)]">
          Directorio de empresas y feed profesional para miembros con negocio propio.
        </p>

        <button
          type="button"
          onClick={onMembershipCtaClick}
          disabled={isMembershipCtaDisabled}
          className={`${membershipCtaClassName} disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {membershipCtaLabel}
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
