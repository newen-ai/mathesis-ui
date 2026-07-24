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
const logoSrc = `${basePath}/mathesis-logo.png`;

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
      nextErrors.email = "Ingresa un email valido.";
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

      <main className="flex min-h-screen items-center justify-center bg-[#EDE9E2] px-4 py-8 font-[family-name:Arial] lg:items-stretch lg:p-0">
        <section className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(10,37,64,0.16)] lg:max-w-none lg:flex-row lg:rounded-none lg:shadow-none">
          {/* Panel de marca (navy): arriba en mobile, columna izquierda a pantalla completa en desktop */}
          <div className="px-6 pb-8 pt-9 text-center lg:flex lg:w-2/5 lg:shrink-0 lg:flex-col lg:justify-between lg:bg-[#0A2540] lg:px-12 lg:py-14 lg:text-left">
            {/* Logo + nombre */}
            <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Logo Mathesis"
                width={64}
                height={64}
                loading="eager"
                decoding="async"
                className="mx-auto h-16 w-16 lg:mx-0 lg:h-9 lg:w-9"
              />
              <div className="mt-2 font-[family-name:Georgia] text-xl font-bold tracking-[0.1em] text-[#0A2540] lg:mt-0 lg:text-xl lg:text-[#FAF8F5]">
                Mathesis
              </div>
            </div>

            {/* Tagline (solo mobile) */}
            <div className="mt-1.5 font-[family-name:Georgia] text-sm italic text-[#0A2540]/70 lg:hidden">
              La primera comunidad intelectual verificada para mentes excepcionales.
            </div>

            {/* Bloque central (solo desktop) */}
            <div className="relative z-10 hidden lg:block">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#C9A84C]/80">
                Comunidad verificada
              </div>
              <div className="mt-4 font-[family-name:Georgia] text-xl font-bold leading-snug text-[#FAF8F5]">
                La primera comunidad intelectual verificada para mentes excepcionales.
              </div>
              <div className="mt-4 max-w-xs font-[family-name:Georgia] text-sm italic leading-relaxed text-[#FAF8F5]/70">
                La red que conecta a los Miembros de Mensa.
              </div>
            </div>

            {/* Pie (solo desktop) */}
            <div className="relative z-10 hidden text-[0.66rem] text-[#FAF8F5]/40 lg:block">
              mathesis.social
            </div>
          </div>

          {/* Columna del formulario: abajo en mobile, derecha en desktop */}
          <div className="px-6 pb-9 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-14 lg:py-14">
            <div className="w-full lg:mx-auto lg:max-w-[440px]">
              <div className="mb-6 hidden font-[family-name:Georgia] text-2xl font-bold text-[#0A2540] lg:block">
                Bienvenido a Mathesis
              </div>

              <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold tracking-wide text-[#0A2540]"
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
                    className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                  />
                  {errors.email ? (
                    <p id="email-error" className="text-xs font-medium text-red-700">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold tracking-wide text-[#0A2540]"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      className="w-full rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2.5 pr-16 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#666666] transition hover:text-[#0A2540]"
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  {errors.password ? (
                    <p id="password-error" className="text-xs font-medium text-red-700">
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                {errors.credentials ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {errors.credentials}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#b8973f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </button>

                <button
                  type="button"
                  className="text-center text-xs text-[#7A6435] transition hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>

              <div className="mt-8 border-t border-[#E8E5E0] pt-4 text-center text-xs leading-relaxed text-[#666666]">
                ¿Sos Miembro de Mensa y todavía no tenés cuenta en Mathesis?
                <br />
                <Link href="/registro" className="font-bold text-[#7A6435] hover:underline">
                  Registrate acá →
                </Link>
                <div className="mt-2">
                  ¿Todavía no sos Miembro de Mensa?{" "}
                  <a
                    href="https://mensa.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#7A6435] hover:underline"
                  >
                    Conocé más en mensa.org
                  </a>
                </div>
              </div>

              <p className="mt-6 text-center text-[0.65rem] tracking-wide text-[#999999]">
                Powered by Newen.solutions
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#EDE9E2] px-4 py-8 font-[family-name:Arial]">
          <section className="flex w-full max-w-sm flex-col rounded-2xl bg-white px-6 py-9 shadow-[0_10px_40px_rgba(10,37,64,0.12)]">
            <p className="text-center text-sm text-[#666666]">Cargando...</p>
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
