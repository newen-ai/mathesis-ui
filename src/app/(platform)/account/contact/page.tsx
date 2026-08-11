"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { sendContactMessage, type ContactMessageCategory } from "@/lib/api/profile";
import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";

type ValidationErrors = {
  category?: string;
  details?: string;
};

const categoryOptions: { value: ContactMessageCategory; label: string }[] = [
  { value: "GENERAL_INQUIRY", label: "Consulta general" },
  { value: "TECHNICAL_ISSUE", label: "Problema técnico" },
  { value: "SUGGESTION", label: "Sugerencia" },
  { value: "BUG_REPORT", label: "Reportar un problema" },
  { value: "OTHER", label: "Otros" },
];

function MobileBottomNav() {
  return (
    <nav className="mt-auto border-t border-[var(--line)] bg-[var(--surface)] px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4 lg:hidden">
      <ul className="grid grid-cols-5 items-end gap-2 text-center text-[0.78rem] font-medium text-[var(--text-secondary)]">
        <li>
          <Link href="/" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="5" y="4.5" width="14" height="15" rx="2" />
                <path d="M12 4.5v15M5 9.5h14" />
              </svg>
            </span>
            Nexum
          </Link>
        </li>
        <li>
          <Link href="/red" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="8" cy="9" r="2.5" />
                <circle cx="16" cy="9" r="2.5" />
                <path d="M4.5 18a4.5 4.5 0 0 1 7 0M12.5 18a4.5 4.5 0 0 1 7 0" />
              </svg>
            </span>
            Agora
          </Link>
        </li>
        <li>
          <button type="button" className="mx-auto block">
            <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-500)] text-[var(--navy-900)] shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Crear
          </button>
        </li>
        <li>
          <Link href="/mensajes" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
              </svg>
            </span>
            Mensajes
          </Link>
        </li>
        <li>
          <Link href="/perfil" className="block text-[var(--brand-500)]">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="3.1" />
                <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            Perfil
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default function ContactPage() {
  const router = useRouter();

  const [category, setCategory] = useState<ContactMessageCategory>("GENERAL_INQUIRY");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/account/configuration");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ValidationErrors = {};

    if (!category) {
      nextErrors.category = "Selecciona un motivo.";
    }

    if (!details.trim()) {
      nextErrors.details = "Contanos más sobre tu consulta.";
    }

    if (details.trim().length > 500) {
      nextErrors.details = "El detalle no puede exceder 500 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const response = await sendContactMessage(category, details);
    setIsSubmitting(false);

    if (response.success) {
      setDidSucceed(true);
    } else {
      setErrors({
        details: response.message || "Error al enviar el mensaje. Intenta de nuevo."
      });
    }
  };

  const form = didSucceed ? (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
      <h2 className="font-[family-name:var(--font-spectral)] text-[1.6rem] font-semibold text-[var(--text-primary)]">
        Mensaje enviado
      </h2>
      <p className="mt-2 text-[0.97rem] leading-relaxed text-[var(--text-secondary)]">
        Gracias por tu mensaje. El equipo de Mathesis lo recibió y te responderá pronto.
      </p>
      <button
        type="button"
        onClick={() => router.push("/account/configuration")}
        className="mt-5 w-full rounded-full bg-[var(--brand-500)] px-6 py-3.5 text-[1rem] font-bold text-[var(--navy-900)] transition hover:brightness-95"
      >
        Volver a configuración
      </button>
    </div>
  ) : (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="block text-[0.97rem] font-bold text-[var(--text-primary)] lg:text-[0.88rem]">
          Motivo
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ContactMessageCategory)}
          aria-invalid={Boolean(errors.category)}
          className="w-full rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-500)] lg:rounded-xl lg:px-4 lg:py-3 lg:text-[0.97rem]"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.category ? (
          <p className="text-sm font-medium text-[var(--danger-500)]">{errors.category}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="details" className="block text-[0.97rem] font-bold text-[var(--text-primary)] lg:text-[0.88rem]">
          Contanos más
        </label>
        <textarea
          id="details"
          placeholder="Detalle (máx. 500 caracteres)..."
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={6}
          aria-invalid={Boolean(errors.details)}
          className="w-full rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)] transition focus:border-[var(--brand-500)] lg:rounded-xl lg:px-4 lg:py-3 lg:text-[0.97rem]"
        />
        <div className="flex items-center justify-between">
          {errors.details ? (
            <p className="text-sm font-medium text-[var(--danger-500)]">{errors.details}</p>
          ) : null}
          <span className="text-[0.85rem] text-[var(--text-soft)]">{details.length}/500</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[var(--brand-500)] px-6 py-4 text-[1.05rem] font-bold text-[var(--navy-900)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 lg:py-3.5"
      >
        {isSubmitting ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );

  return (
    <div className="mathesis-shell flex min-h-screen flex-col bg-[var(--background)]">
      <TopBar navItems={navItems} />

      {/* Mobile header */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4 lg:hidden">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver a configuración"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--navy-900)] transition hover:bg-[var(--surface-2)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="m14.5 5.5-7 6.5 7 6.5" />
          </svg>
        </button>
        <h1 className="font-[family-name:var(--font-spectral)] text-[1.75rem] font-semibold leading-none text-[var(--navy-900)]">
          Contactar a Mathesis
        </h1>
      </div>

      {/* Mobile form */}
      <div className="flex flex-1 flex-col px-5 pb-4 pt-6 lg:hidden">
        {form}
      </div>

      {/* Desktop: two-column layout */}
      <div className="hidden flex-1 lg:flex">
        {/* Gold left panel */}
        <div
          className="relative flex w-[38%] shrink-0 flex-col justify-between overflow-hidden px-12 py-14"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          <span
            className="pointer-events-none absolute right-[-88px] top-[-50px] h-56 w-56 rounded-full border"
            style={{ borderColor: "color-mix(in srgb, var(--navy-900) 16%, transparent)" }}
          />
          <span
            className="pointer-events-none absolute bottom-[-90px] left-[55%] h-56 w-56 rounded-full border"
            style={{ borderColor: "color-mix(in srgb, var(--navy-900) 14%, transparent)" }}
          />

          <div className="relative z-10 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_SRC}
              alt="Logo Mathesis"
              width={36}
              height={36}
              loading="eager"
              decoding="async"
              className="h-9 w-9"
            />
            <p className="font-[family-name:Georgia] text-xl font-bold tracking-[0.06em] text-[var(--navy-900)]">
              Mathesis
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--navy-800)]">
              Estamos para ayudarte
            </p>
            <h2 className="mt-3 font-[family-name:Georgia] text-[2rem] font-bold leading-tight text-[var(--navy-900)]">
              ¿Necesitás algo? Escribinos.
            </h2>
            <p className="mt-4 font-[family-name:Georgia] text-[0.95rem] italic text-[var(--navy-800)]">
              El equipo de Mathesis lo recibe y te responde por acá mismo, a tu Mensajería.
            </p>
          </div>

          <p className="relative z-10 text-[0.66rem] text-[var(--navy-700)]">mathesis.social</p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col justify-center bg-[var(--surface)] px-14 py-14">
          <div className="mx-auto w-full max-w-[520px]">
            <h1 className="font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-none text-[var(--navy-900)]">
              Contactar a Mathesis
            </h1>
            <div className="mt-7">
              {form}
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
