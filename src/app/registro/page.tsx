"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { normalizeEmailInput } from "@/lib/utils/email";

type ValidationErrors = {
  dni?: string;
  email?: string;
  adult?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  general?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegistroPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  // Paso 1 — verificación de membresía
  const [organization, setOrganization] = useState("Mensa Argentina");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [isAdult, setIsAdult] = useState(false);

  // Paso 2 — crear acceso
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [popupInfo, setPopupInfo] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  useRedirectIfAuthenticated("/");

  const onBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.push("/login");
    }
  };

  const onVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmailInput(email);
    const nextErrors: ValidationErrors = {};

    if (!dni.trim() || !/^\d{6,}$/.test(dni.trim())) {
      nextErrors.dni = "Ingresa un DNI valido (solo numeros).";
    }
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      nextErrors.email = "Ingresa un email valido.";
    }
    if (!isAdult) {
      nextErrors.adult = "Debes confirmar que sos mayor de 18 anios.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // La verificación real contra Mensa la resuelve el backend (pendiente).
    setStep(2);
  };

  const onCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmailInput(email);

    const nextErrors: ValidationErrors = {};

    if (!password || password.length < 8) {
      nextErrors.password = "La clave debe tener al menos 8 caracteres.";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Las claves no coinciden.";
    }
    if (!acceptedTerms) {
      nextErrors.terms = "Debes aceptar los Terminos y Condiciones.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email: normalizedEmail,
      password,
    });

    if (!result.success) {
      setErrors({ general: result.message });
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

    router.replace(`/registro/enviado?email=${encodeURIComponent(normalizedEmail)}`);
    router.refresh();
  };

  const stepLabel =
    step === 1 ? "Paso 1 de 2 · Verificación de Miembro" : "Paso 2 de 2 · Crear acceso";
  const stepTitle = step === 1 ? "Verificá tu membresía" : "Creá tu acceso";
  const formHeading = step === 1 ? "Registrate" : "Creá tu acceso";
  const formSub =
    step === 1
      ? "Verificamos tu membresía con Mensa Argentina."
      : "Ya verificamos tu membresía. Creá tu contraseña para terminar.";

  return (
    <>
      <ServiceErrorPopup
        isOpen={popupInfo !== null}
        title={popupInfo?.title ?? ""}
        message={popupInfo?.message ?? ""}
        details={popupInfo?.details}
        onClose={() => setPopupInfo(null)}
      />

      <main className="flex h-dvh flex-col bg-[#FAF8F5] font-[family-name:Arial] lg:bg-white">
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Navy: header en mobile / columna de marca a pantalla completa en desktop */}
          <div className="bg-[#0A2540] px-4 py-3 lg:flex lg:w-2/5 lg:shrink-0 lg:flex-col lg:px-12 lg:py-12">
            {/* Desktop: logo */}
            <div className="hidden lg:flex lg:items-center lg:justify-center lg:gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                  src={BRAND_LOGO_SRC}
                alt="Logo Mathesis"
                width={32}
                height={32}
                loading="eager"
                decoding="async"
                className="h-8 w-8"
              />
              <span className="font-[family-name:Georgia] text-lg font-bold tracking-[0.1em] text-[#FAF8F5]">
                Mathesis
              </span>
            </div>

            {/* Mobile: flecha + eyebrow */}
            <div className="mb-1 flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver"
                className="text-base font-bold text-[#FAF8F5]"
              >
                ←
              </button>
              <div className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/70">
                {stepLabel}
              </div>
            </div>

            {/* Desktop: contenido de marca (centrado vertical y horizontalmente) */}
            <div className="hidden lg:my-auto lg:block lg:text-center">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#C9A84C]/80">
                {stepLabel}
              </div>
              {step === 1 ? (
                <>
                  <div className="mt-3 font-[family-name:Georgia] text-2xl font-bold leading-snug text-[#FAF8F5]">
                    Verificá tu membresía
                  </div>
                  <div className="mt-4 text-sm leading-relaxed text-[#FAF8F5]/70 lg:mx-auto lg:max-w-xs">
                    Mathesis verifica tu identidad con los datos que ya tenés registrados en tu
                    organización — no hace falta ningún trámite adicional.
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 font-[family-name:Georgia] text-2xl font-bold leading-snug text-[#FAF8F5]">
                    ¡Bienvenido!
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#C9A84C]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m8 12 3 3 5-6" />
                    </svg>
                    Membresía verificada
                  </div>
                  <div className="mt-3 text-sm text-[#FAF8F5]/70">{organization}</div>
                </>
              )}
            </div>

            {/* Mobile: título + barra de progreso */}
            <div className="lg:hidden">
              <div className="font-[family-name:Georgia] text-lg font-bold text-[#FAF8F5]">
                {stepTitle}
              </div>
              <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full bg-[#C9A84C] transition-all ${
                    step === 1 ? "w-1/2" : "w-full"
                  }`}
                />
              </div>
            </div>

            {/* Desktop: stepper (al fondo) */}
            <div className="hidden lg:flex lg:flex-col lg:gap-5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] font-bold ${
                    step === 2
                      ? "border-[#C9A84C] bg-[#C9A84C] text-[#0A2540]"
                      : "border-[#C9A84C] text-[#C9A84C]"
                  }`}
                >
                  {step === 2 ? "✓" : "1"}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    step === 2 ? "text-[#C9A84C]" : "text-[#FAF8F5]"
                  }`}
                >
                  Verificación
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] font-bold ${
                    step === 2 ? "border-[#C9A84C] text-[#C9A84C]" : "border-white/30 text-white/50"
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-sm font-semibold ${
                    step === 2 ? "text-[#FAF8F5]" : "text-white/50"
                  }`}
                >
                  Contraseña
                </span>
              </div>
            </div>
          </div>

          {/* Formulario: cuerpo scrolleable en mobile / columna derecha en desktop */}
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:overflow-visible lg:px-12 lg:py-12">
            <div className="lg:mx-auto lg:max-w-[440px]">
              {/* Desktop: encabezado del formulario */}
              <div className="mb-5 hidden lg:block">
                <div className="font-[family-name:Georgia] text-2xl font-bold text-[#0A2540]">
                  {formHeading}
                </div>
                <div className="mt-1 text-sm text-[#666666]">{formSub}</div>
              </div>

              {step === 1 ? (
                <form className="flex flex-col gap-2.5" onSubmit={onVerify} noValidate>
                  <p className="text-xs leading-relaxed text-[#666666] lg:hidden">
                    Mathesis verifica tu identidad con los datos que ya tenés registrados en tu
                    organización — no hace falta ningún trámite adicional.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="organization" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      ¿De qué organización sos Miembro?
                    </label>
                    <select
                      id="organization"
                      value={organization}
                      onChange={(event) => setOrganization(event.target.value)}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    >
                      <option value="Mensa Argentina">Mensa Argentina</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dni" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      DNI (Documento Nacional de Identidad)
                    </label>
                    <input
                      id="dni"
                      inputMode="numeric"
                      placeholder="Ej: 30123456"
                      value={dni}
                      onChange={(event) => setDni(event.target.value)}
                      aria-invalid={Boolean(errors.dni)}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    {errors.dni ? (
                      <p className="text-xs font-medium text-red-700">{errors.dni}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      Email registrado en Mensa Argentina
                    </label>
                    <input
                      id="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    <p className="text-[0.7rem] leading-relaxed text-[#666666]">
                      Es el mail con el que Mensa Argentina se comunica con vos. Puede ser tu mail
                      personal o tu mail @mensa.org.ar.
                    </p>
                    {errors.email ? (
                      <p className="text-xs font-medium text-red-700">{errors.email}</p>
                    ) : null}
                  </div>

                  <label className="mt-6 inline-flex items-start gap-2 text-sm text-[#666666]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-[#c6ced8] text-[#C9A84C] focus:ring-[#C9A84C]"
                      checked={isAdult}
                      onChange={(event) => setIsAdult(event.target.checked)}
                    />
                    Confirmo que soy mayor de 18 años.
                  </label>
                  {errors.adult ? (
                    <p className="text-xs font-medium text-red-700">{errors.adult}</p>
                  ) : null}

                  <button
                    type="submit"
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#C9A84C] px-6 py-2.5 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#b8973f]"
                  >
                    <svg
                      className="lg:hidden"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Verificar y continuar
                  </button>

                  <p className="rounded-lg bg-white px-3 py-2 text-[0.7rem] leading-relaxed text-[#666666] lg:bg-[#FAF8F5]">
                    Si el DNI y el email no coinciden con lo que Mensa Argentina tiene registrado, no
                    vamos a poder crear tu cuenta todavía. El piloto es exclusivo para Miembros de
                    Mensa Argentina. Este DNI se usa solo para verificar contra Mensa Argentina en el
                    momento del registro — Mathesis no lo guarda.
                  </p>

                  <p className="text-center text-xs text-[#666666]">
                    ¿Ya tenés cuenta?{" "}
                    <Link href="/login" className="font-bold text-[#7A6435] hover:underline">
                      Iniciar sesión
                    </Link>
                  </p>
                </form>
              ) : (
                <form className="flex flex-col gap-2.5" onSubmit={onCreateAccount} noValidate>
                  <div className="rounded-lg border border-[#C9A84C]/40 bg-white px-3.5 py-3 lg:hidden">
                    <div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#7A6435]">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m8 12 3 3 5-6" />
                      </svg>
                      Membresía verificada
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-[#0A2540]">{email}</div>
                    <div className="text-xs text-[#666666]">{organization}</div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(errors.password)}
                        className="w-full rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 pr-16 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] transition hover:text-[#0A2540]"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                          {showPassword ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
                        </svg>
                      </button>
                    </div>
                    <p className="text-[0.7rem] leading-relaxed text-[#666666]">
                      Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un
                      carácter especial (ej: ! @ # $).
                    </p>
                    {errors.password ? (
                      <p className="text-xs font-medium text-red-700">{errors.password}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      Repetir contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        className="w-full rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 pr-11 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] transition hover:text-[#0A2540]"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                          {showPassword ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
                        </svg>
                      </button>
                    </div>
                    {errors.confirmPassword ? (
                      <p className="text-xs font-medium text-red-700">{errors.confirmPassword}</p>
                    ) : null}
                  </div>

                  <label className="inline-flex items-start gap-2 text-sm text-[#666666]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-[#c6ced8] text-[#C9A84C] focus:ring-[#C9A84C]"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                    />
                    <span>
                      Leí y acepto los{" "}
                      <span className="font-semibold text-[#7A6435] hover:underline">
                        Términos y Condiciones
                      </span>{" "}
                      y la{" "}
                      <span className="font-semibold text-[#7A6435] hover:underline">
                        Política de Privacidad
                      </span>{" "}
                      de Mathesis.
                    </span>
                  </label>
                  {errors.terms ? (
                    <p className="text-xs font-medium text-red-700">{errors.terms}</p>
                  ) : null}

                  {errors.general ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {errors.general}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-full bg-[#C9A84C] px-6 py-2.5 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#b8973f] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Creando cuenta..." : "Crear cuenta y continuar"}
                  </button>

                  <p className="text-center text-xs italic text-[#666666]">
                    Ya casi sos parte de una comunidad que piensa distinto.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-[#E8E5E0] bg-white py-2.5 text-center text-[0.65rem] tracking-wide text-[#666666]">
          Powered by <span className="font-bold text-[#7A6435]">Newen.solutions</span>
        </div>
      </main>
    </>
  );
}
