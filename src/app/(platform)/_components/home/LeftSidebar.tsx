import { AppCard } from "@/components/ui/AppCard";

type LeftSidebarProps = {
  initials: string;
  userDisplayName: string;
  puesto: string;
  empresaActual: string;
  profileCompletion: number;
};

export function LeftSidebar({
  initials,
  userDisplayName,
  puesto,
  empresaActual,
  profileCompletion,
}: LeftSidebarProps) {
  return (
    <aside className="mathesis-fade-up space-y-4 lg:sticky lg:top-20">
      <AppCard className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#0a66c2] to-[#20a4b8]" />
        <div className="-mt-8 px-4 pb-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-slate-800 text-lg font-bold text-white">
            {initials || "M"}
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-spectral)] text-xl font-semibold text-slate-900">
            {userDisplayName}
          </h1>
          {puesto || empresaActual ? (
            <p className="text-sm text-slate-600">
              {puesto}
              {empresaActual ? ` en ${empresaActual}` : ""}
            </p>
          ) : null}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--brand-700)]">
            Mensa Argentina Member Network
          </p>
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-600">Perfil completado: {profileCompletion}%</p>
          <div className="mt-2 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-[var(--brand-700)] transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>
      </AppCard>
    </aside>
  );
}
