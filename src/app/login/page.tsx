"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/api/auth";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";

type ValidationErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const logoSrc = `${basePath}/mensa-empresarios-logo.svg`;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSafeInternalPath(path: string | null): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    return isSafeInternalPath(candidate) ? candidate : "/";
  }, [searchParams]);

  const initialEmail = useMemo(() => {
    const candidate = searchParams.get("email");
    return candidate?.trim().toLowerCase() ?? "";
  }, [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [popupInfo, setPopupInfo] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  useRedirectIfAuthenticated(nextPath);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors: ValidationErrors = {};

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      nextErrors.email = "Ingresa un email profesional valido.";
    }

    if (!password || password.length < 8) {
      nextErrors.password = "La clave debe tener al menos 8 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await login({
      email: trimmedEmail,
      password,
    });

    if (!result.success) {
      setErrors({
        credentials: result.message,
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

    router.replace(nextPath);
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
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <section className="linkedin-card overflow-hidden bg-white p-6 sm:p-8">
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
                  <p className="text-xs text-slate-500">Ingreso seguro</p>
                </div>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-[family-name:var(--font-spectral)] text-3xl font-semibold text-slate-900">
                    Iniciar sesion
                  </h1>
                  <p className="mt-2 max-w-lg text-sm text-slate-600">
                    Accede a tu red profesional, conversaciones privadas y tablero de actividad.
                  </p>
                </div>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)]"
                >
                  Registrarse
                </Link>
              </div>

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
                      autoComplete="current-password"
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

                {errors.credentials ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {errors.credentials}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    Mantener sesion iniciada
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-[var(--brand-700)] transition hover:text-[var(--brand-900)]"
                  >
                    Olvide mi clave
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-700)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Validando credenciales..." : "Entrar"}
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500">
                Al continuar aceptas las politicas de uso interno de Mensa Empresarios.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                ¿No tenes cuenta?{" "}
                <Link
                  href="/registro"
                  className="font-semibold text-[var(--brand-700)] underline decoration-[var(--brand-700)]/50 underline-offset-4"
                >
                  Registrate aca
                </Link>
              </p>
          </section>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="linkedin-shell min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-2xl space-y-5">
            <section className="linkedin-card overflow-hidden bg-white p-6 sm:p-8">
              <p className="text-sm text-slate-600">Cargando...</p>
            </section>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
