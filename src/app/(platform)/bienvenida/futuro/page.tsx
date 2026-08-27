import type { ReactNode } from "react";
import { WelcomeFinishButton } from "./WelcomeFinishButton";

const priorityCards = [
  {
    eyebrow: "Lo más esperado",
    title: "Affinitas",
    description:
      "Encontrá a quienes piensan como vos: match por intereses y aptitudes compartidas, no solo por profesión.",
    highlighted: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="m9 15 1.6-5.4L16 8l-1.6 5.4L9 15Z" />
      </svg>
    ),
  },
  {
    eyebrow: "Visión Mathesis",
    title: "Comunidad Global",
    description:
      "Empezamos en Mensa Argentina, pero la comunidad que estamos construyendo no tiene fronteras: cada Mensa Nacional del mundo, conectada.",
    highlighted: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="8" r="2.2" />
        <path d="M4 18a4 4 0 0 1 8 0" />
        <path d="M12.5 17a3.5 3.5 0 0 1 6 0" />
      </svg>
    ),
  },
];

const futureCards = [
  {
    title: "Convivium",
    description: "Encuentros y eventos entre miembros, presenciales y virtuales.",
    badge: "PRÓXIMAMENTE",
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4.5" y="6.5" width="15" height="13" rx="2" />
        <path d="M8 4.5v4" />
        <path d="M16 4.5v4" />
        <path d="M4.5 10.5h15" />
      </svg>
    ),
  },
  {
    title: "Xenia",
    description: "Viajás y tenés quién te reciba: conectá con Mensa en cualquier parte del mundo.",
    badge: "PRÓXIMAMENTE",
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="2.4" />
        <circle cx="16.5" cy="8" r="2" />
        <path d="M5 18a4 4 0 0 1 8 0" />
        <path d="M13 17.5a3.2 3.2 0 0 1 5 0" />
      </svg>
    ),
  },
  {
    title: "Bolsa de Trabajo",
    description: "Avisos laborales pensados para mentes como la tuya, compartidos por tu propia comunidad.",
    badge: "PRÓXIMAMENTE",
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4.5" y="7.5" width="15" height="11" rx="2" />
        <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      </svg>
    ),
  },
  {
    title: "Daimon",
    description: "Canjeá tus aportes a la comunidad por beneficios y descuentos con marcas aliadas.",
    badge: "PRÓXIMAMENTE",
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4.5" y="9" width="15" height="10" rx="2" />
        <path d="M12 9v10" />
        <path d="M7.5 9V7.5A2.5 2.5 0 0 1 10 5h.5A1.5 1.5 0 0 1 12 6.5V9" />
        <path d="M16.5 9V7.5A2.5 2.5 0 0 0 14 5h-.5A1.5 1.5 0 0 0 12 6.5" />
      </svg>
    ),
  },
];

function FeatureCard({
  title,
  description,
  icon,
  badge,
  eyebrow,
  highlighted = false,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  eyebrow?: string;
  highlighted?: boolean;
}) {
  const bodyClassName = highlighted
    ? "border-[var(--brand-500)] bg-[color-mix(in_srgb,var(--surface)_86%,var(--brand-50))]"
    : "border-[var(--line)] bg-[var(--surface)]";
  const iconClassName = highlighted
    ? "bg-[var(--navy-900)] text-[var(--brand-500)]"
    : "bg-[var(--surface-muted)] text-[var(--brand-700)]";
  const contentSpacingClassName = eyebrow ? "mt-8" : "mt-0";

  return (
    <article
      className={`relative overflow-hidden rounded-[1rem] border px-3.5 py-2.5 shadow-[0_6px_18px_rgba(17,43,69,0.05)] ${bodyClassName}`}
    >
      {eyebrow ? (
        <div className="absolute left-0 top-0 rounded-br-[0.95rem] rounded-tl-[0.95rem] bg-[var(--brand-500)] px-3 py-1 text-scale-1 font-bold uppercase tracking-[0.06em] text-[var(--navy-900)]">
          {eyebrow}
        </div>
      ) : null}

      <div className={`${contentSpacingClassName} flex flex-col gap-2.5 md:flex-row md:items-start`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-[family-name:var(--font-spectral)] text-[0.95rem] font-semibold leading-[1.08] text-[var(--heading-primary)]">
              {title}
            </h2>
            {badge ? (
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-scale-1 font-bold tracking-[0.08em] text-[var(--brand-700)]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 max-w-[40rem] text-[0.82rem] leading-[1.2] text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function BienvenidaFuturoPage() {
  return (
    <div data-welcome-scroll-lock className="welcome-future-shell text-[var(--text-primary)]">
      <div className="welcome-future-layout">
        <section className="welcome-future-hero flex items-center justify-center bg-[var(--navy-900)] px-6 py-10 text-center text-white lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mx-auto flex h-10 w-10 items-center justify-center text-[1.65rem] text-[var(--brand-500)]">∫</div>
            <h1 className="mt-4 font-[family-name:var(--font-spectral)] text-[2.05rem] font-semibold leading-[0.98] text-white lg:text-[2.45rem]">
              Lo mejor todavía no llegó
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-[0.9rem] leading-[1.35] text-white/82 lg:text-[1rem]">
              Mathesis no para de sumar funciones nuevas. Esto es apenas el comienzo de lo que esta comunidad puede ser para vos.
            </p>
          </div>
        </section>

        <section className="welcome-future-content flex items-center justify-center">
          <main className="mx-auto my-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 sm:px-6 lg:px-8">
            {priorityCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}

            {futureCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}

            <section className="px-4 pt-2 text-center">
              <p className="mx-auto max-w-3xl font-[family-name:var(--font-spectral)] text-[0.98rem] italic leading-[1.35] text-[var(--text-secondary)] lg:text-[1.08rem]">
                Sumá sugerencias en el Feed: lo que se viene, en parte, lo decidís vos.
              </p>
            </section>

            <WelcomeFinishButton />
          </main>
        </section>
      </div>
    </div>
  );
}