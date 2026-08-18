export function DiscoverMathesis() {
  return (
    <>
      <h2 className="pt-1 text-scale-2 font-bold tracking-[0.08em] text-[var(--text-secondary)]">DESCUBRÍ MATHESIS</h2>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--brand-100)_68%,var(--surface))] text-[var(--brand-800)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M9 4h4a2 2 0 1 1 4 0h3v5a2 2 0 1 1 0 4v5h-5a2 2 0 1 1-4 0H6v-5a2 2 0 1 1 0-4V4h3a2 2 0 1 1 0 4" />
          </svg>
        </div>
        <h3 className="mt-3 text-[1.45rem] font-semibold leading-tight text-[var(--heading-primary)]">Desafío Diario</h3>
        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
          Un acertijo nuevo cada día. Sumá puntos y compará tu racha con la comunidad.
        </p>
        <button type="button" disabled className="mt-4 text-scale-2 font-semibold text-[var(--brand-800)] opacity-85">
          Jugá el desafío de hoy →
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[var(--brand-500)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M4.5 20V6.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20" />
            <path d="M14.5 20h5V11.5a1 1 0 0 0-1-1h-4" />
          </svg>
        </div>
        <h3 className="mt-3 text-[1.45rem] font-semibold leading-tight text-[var(--heading-primary)]">Mensa Empresarios</h3>
        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
          Directorio de empresas de socios Mensa. Encontrá proveedores o sumá la tuya.
        </p>
        <button type="button" disabled className="mt-4 text-scale-2 font-semibold text-[var(--brand-800)] opacity-85">
          Conocé el Directorio →
        </button>
      </section>
    </>
  );
}