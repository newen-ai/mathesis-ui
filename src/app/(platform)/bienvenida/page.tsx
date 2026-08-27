import Link from "next/link";

const currentFeatures = [
  {
    title: "Agora",
    description: "Compartí ideas y descubrí lo que piensa la comunidad.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="6" width="14" height="4" rx="1.2" />
        <rect x="5" y="14" width="14" height="4" rx="1.2" />
      </svg>
    ),
  },
  {
    title: "Nexum",
    description: "Conectá con otros miembros verificados.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="2.5" />
        <circle cx="15.5" cy="8" r="2" />
        <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
        <path d="M13.5 17.5a3.5 3.5 0 0 1 5 0" />
      </svg>
    ),
  },
  {
    title: "Mensajería",
    description: "Hablá directo con quien quieras, sin ruido.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 7.5h12a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 18 16.5H10l-4 3v-3H6A1.5 1.5 0 0 1 4.5 15V9A1.5 1.5 0 0 1 6 7.5Z" />
      </svg>
    ),
  },
  {
    title: "Creá tu perfil profesional",
    description: "Experiencia, educación y proyectos, a tu manera.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3" />
        <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
      </svg>
    ),
  },
  {
    title: "Comunidad por grupos",
    description: "Espacios de discusión temáticos dentro de Agora.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="10" r="2.5" />
        <circle cx="16" cy="10" r="2.5" />
        <path d="M3.5 18a4.5 4.5 0 0 1 9 0" />
        <path d="M11.5 18a4.5 4.5 0 0 1 9 0" />
      </svg>
    ),
  },
  {
    title: "Credencial digital",
    description: "Tu credencial de Miembro de Mensa, siempre a mano.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4.5" y="6" width="15" height="12" rx="2" />
        <path d="M8 10h4" />
        <path d="M8 13h6" />
        <circle cx="16" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Desafío diario",
    description: "Un acertijo nuevo cada día, igual para toda la comunidad.",
    badge: "PRONTO",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4v4" />
        <path d="M12 16v4" />
        <path d="M4 12h4" />
        <path d="M16 12h4" />
        <path d="m6.5 6.5 2.8 2.8" />
        <path d="m14.7 14.7 2.8 2.8" />
        <path d="m17.5 6.5-2.8 2.8" />
        <path d="m9.3 14.7-2.8 2.8" />
      </svg>
    ),
  },
];

const completedSteps = ["Verificación", "Contraseña"];

export default function BienvenidaPage() {
  return (
  <div
    data-welcome-scroll-lock
    className="fixed inset-x-0 top-0 bottom-10 overflow-hidden bg-[var(--surface)] text-[var(--text-primary)] md:bottom-11"
  >
      <main className="grid h-full w-full grid-cols-1 overflow-hidden bg-[var(--surface)] lg:grid-cols-[1.03fr_1.55fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[var(--navy-900)] px-7 py-7 text-white lg:px-10 lg:py-8">
          <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[-5rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border border-white/10" />

          <div className="flex items-center gap-2.5">
            <span className="text-[1.65rem] font-semibold text-[var(--brand-500)]">∫</span>
            <span className="font-[family-name:var(--font-spectral)] text-[1.65rem] font-semibold tracking-[0.03em] text-white">
              Mathesis
            </span>
          </div>

          <div className="max-w-[26rem] space-y-3 py-8 lg:py-0">
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)]">
              Ya sos parte
            </p>
            <h1 className="font-[family-name:var(--font-spectral)] text-[2.05rem] font-semibold leading-[0.98] text-white lg:text-[2.45rem]">
              Bienvenido a Mathesis.
            </h1>
            <p className="max-w-[20rem] font-[family-name:var(--font-spectral)] text-[0.9rem] italic leading-[1.35] text-white/78 lg:text-[1rem]">
              Ya sos parte de la primera comunidad intelectual verificada para mentes excepcionales.
            </p>
          </div>

          <ul className="mb-2 space-y-3 text-[var(--brand-300)] lg:mb-3">
            {completedSteps.map((step) => (
              <li key={step} className="flex items-center gap-2.5 text-[0.9rem] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-500)] text-[var(--navy-900)]">
                  ✓
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col justify-center px-5 py-5 sm:px-7 lg:px-10 lg:py-6">
          <div className="mx-auto w-full max-w-[45rem] space-y-3">
            <header className="space-y-2">
              <h2 className="font-[family-name:var(--font-spectral)] text-[1.8rem] font-semibold leading-[1.04] text-[var(--heading-primary)] lg:text-[2.2rem]">
                Esto es lo que te espera
              </h2>
            </header>

            <div className="space-y-2.5">
              {currentFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="flex items-start gap-2.5 rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 shadow-[0_6px_18px_rgba(17,43,69,0.05)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--brand-700)]">
                    {feature.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-[family-name:var(--font-spectral)] text-[0.95rem] font-semibold leading-[1.08] text-[var(--heading-primary)]">
                        {feature.title}
                      </h3>
                      {feature.badge ? (
                        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-scale-1 font-bold tracking-[0.08em] text-[var(--brand-700)]">
                          {feature.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[0.82rem] leading-[1.2] text-[var(--text-secondary)]">{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <Link
              href="/bienvenida/futuro"
              className="flex min-h-12 items-center justify-center rounded-full bg-[var(--brand-500)] px-6 text-center text-[0.95rem] font-semibold text-[var(--on-brand)] transition hover:bg-[var(--brand-300)]"
            >
              ¿Qué viene a futuro?
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}