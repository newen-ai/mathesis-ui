"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { normalizeEmailInput } from "@/lib/utils/email";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";
import { requestPasswordReset } from "@/lib/api/auth";

type ValidationErrors = {
  email?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [popupInfo, setPopupInfo] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = normalizeEmailInput(email);
    const nextErrors: ValidationErrors = {};

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      nextErrors.email = "Ingresa un email valido.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await requestPasswordReset({ email: trimmedEmail });

    if (!result.success) {
      setPopupInfo({
        title: "Error de servicio",
        message: result.message,
        details:
          result.details ??
          (result.status ? `HTTP ${result.status}` : "Sin detalles adicionales."),
      });
      setIsSubmitting(false);
      return;
    }

    router.push(`/forgot-password/sent?email=${encodeURIComponent(trimmedEmail)}`);
  };

  return (
    <>
      <ServiceErrorPopup
        isOpen={popupInfo !== null}
        title={popupInfo?.title ?? ""}
        message={popupInfo?.message ?? ""}
        details={popupInfo?.details}
        onClose={() => setPopupInfo(null)}
      />

      <main
        className="min-h-screen"
        style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
      >
      <section className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="px-8 pb-10 pt-9 lg:hidden" style={{ backgroundColor: "var(--navy-900)" }}>
          <Link
            href="/login"
            className="inline-flex text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C] transition hover:opacity-80"
          >
            ← Atrás
          </Link>
          <h1 className="mt-3 font-[family-name:Georgia] text-[1.35rem] leading-[1.08] font-bold text-[#FAF8F5]">
            Recuperar contraseña
          </h1>
          <div className="mt-6 h-1 w-full rounded-full bg-[#C9A84C]" />
        </div>

        <div
          className="relative hidden overflow-hidden text-center lg:flex lg:w-2/5 lg:shrink-0 lg:flex-col lg:justify-between lg:px-12 lg:py-14 lg:text-left"
          style={{ backgroundColor: "var(--navy-900)" }}
        >
          <span
            className="pointer-events-none absolute right-[-92px] top-[-52px] hidden h-56 w-56 rounded-full border lg:block"
            style={{ borderColor: "color-mix(in srgb, var(--brand-500) 26%, transparent)" }}
          />
          <span
            className="pointer-events-none absolute bottom-[-94px] left-[58%] hidden h-56 w-56 rounded-full border lg:block"
            style={{ borderColor: "color-mix(in srgb, var(--brand-500) 24%, transparent)" }}
          />

          <div className="relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_SRC}
              alt="Logo Mathesis"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
              className="mx-auto h-16 w-16 lg:mx-0 lg:h-9 lg:w-9"
            />
            <p className="mt-2 font-[family-name:Georgia] text-xl font-bold tracking-[0.1em] text-[#FAF8F5] lg:mt-0 lg:text-xl">
              Mathesis
            </p>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C]">Recuperar acceso</p>
            <h1 className="mt-4 font-[family-name:Georgia] text-[2.2rem] font-bold leading-tight text-[#FAF8F5] lg:max-w-[350px] lg:text-[3.15rem] lg:leading-[1.08]">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="mx-auto mt-4 max-w-[370px] font-[family-name:Georgia] text-base italic leading-relaxed text-[#D7DCE3] lg:mx-0 lg:max-w-xs lg:text-sm">
              Ingresá el mail con el que te registraste en Mathesis y te mandaremos un link para crear una contraseña nueva.
            </p>
          </div>

          <p className="relative z-10 mt-10 text-[0.66rem] text-[#8EA0B6] lg:mt-0">mathesis.social</p>
        </div>

        <div
          className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:justify-center lg:px-14 lg:py-14"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="w-full lg:mx-auto lg:max-w-[440px]">
            <div className="mt-0 lg:mt-0">
              <h2
                className="hidden font-[family-name:Georgia] text-[1.35rem] font-bold text-[#0A2540] lg:block"
                style={{ color: "var(--text-primary)" }}
              >
                Recuperar contraseña
              </h2>
              <p className="text-sm leading-relaxed lg:mt-2 lg:text-sm" style={{ color: "var(--text-secondary)" }}>
                Te mandaremos un link para crear una nueva.
              </p>
            </div>

            <form className="mt-8 flex flex-col gap-5 lg:mt-6 lg:gap-4" onSubmit={onSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-bold tracking-wide lg:text-xs"
                  style={{ color: "var(--text-primary)" }}
                >
                  Mail
                </label>
                <input
                  id="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="tu@mail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="rounded-2xl border-[1.5px] px-5 py-2.5 text-sm outline-none transition lg:rounded-lg lg:px-3.5 lg:py-2.5 lg:text-sm"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--surface)",
                  }}
                />
                {errors.email ? (
                  <p id="email-error" className="text-sm font-medium text-red-600">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 lg:mt-1 lg:text-sm"
                style={{ backgroundColor: "var(--brand-500)" }}
              >
                {isSubmitting ? "Enviando..." : "Enviar link de recuperación"}
              </button>

              <Link
                href="/login"
                className="mt-1 hidden text-center text-sm transition hover:opacity-80 lg:block lg:text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                ← Volver a ingresar
              </Link>
            </form>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
