"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";

type ValidationErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  general?: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const logoSrc = `${basePath}/mensa-empresarios-logo.svg`;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegistroPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [popupInfo, setPopupInfo] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  useRedirectIfAuthenticated("/");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: ValidationErrors = {};

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      nextErrors.email = "Ingresa un email valido.";
    }

    if (!password || password.length < 8) {
      nextErrors.password = "La clave debe tener al menos 8 caracteres.";
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Las claves no coinciden.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Debes aceptar las condiciones para registrarte.";
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
      setErrors({
        general: result.message,
      });
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

    router.replace("/");
    router.refresh();
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

      <main className="linkedin-shell min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <section className="linkedin-card bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo Mensa Empresarios"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
            />
            <div>
              <p className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-slate-900">
                Mensa Empresarios
              </p>
              <p className="text-xs text-slate-500">Registro de cuenta</p>
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-spectral)] text-3xl font-semibold text-slate-900">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tu cuenta se registra contra el servicio de autenticacion.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <label className="mensa-field" htmlFor="email">
              Email profesional
              <input
                id="email"
                autoComplete="email"
                inputMode="email"
                placeholder="tu.nombre@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </label>
            {errors.email ? (
              <p id="email-error" className="text-xs font-medium text-red-700">
                {errors.email}
              </p>
            ) : null}

            <label className="mensa-field" htmlFor="password">
              Clave
              <div className="flex items-center gap-2 rounded-[0.6rem] border border-[#c6ced8] bg-white px-2 focus-within:border-[var(--brand-700)] focus-within:shadow-[0_0_0_3px_rgba(10,102,194,0.16)]">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  className="!border-0 !shadow-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>
            {errors.password ? (
              <p id="password-error" className="text-xs font-medium text-red-700">
                {errors.password}
              </p>
            ) : null}

            <label className="mensa-field" htmlFor="confirmPassword">
              Repetir clave
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite tu clave"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              />
            </label>
            {errors.confirmPassword ? (
              <p id="confirm-password-error" className="text-xs font-medium text-red-700">
                {errors.confirmPassword}
              </p>
            ) : null}

            <label className="inline-flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              Acepto las condiciones de uso y privacidad interna de Mensa Empresarios.
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
              className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-700)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            ¿Ya tenes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--brand-700)] underline decoration-[var(--brand-700)]/50 underline-offset-4"
            >
              Inicia sesion
            </Link>
          </p>
          </section>
        </div>
      </main>
    </>
  );
}
