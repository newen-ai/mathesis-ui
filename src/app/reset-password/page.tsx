"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { resetPassword } from "@/lib/api/auth";
import { evaluatePasswordStrength } from "@/lib/utils/password";

type ValidationErrors = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => {
    const raw = searchParams.get("token") ?? "";
    return raw.trim();
  }, [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const [secondsUntilRedirect, setSecondsUntilRedirect] = useState(2);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [popupInfo, setPopupInfo] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const strength = evaluatePasswordStrength(password);

  const semaphoreColors =
    strength.strength === "weak"
      ? ["var(--danger-500)", "var(--line)", "var(--line)"]
      : strength.strength === "normal"
        ? ["var(--brand-500)", "var(--brand-500)", "var(--line)"]
        : ["#2E9F61", "#2E9F61", "#2E9F61"];

  useEffect(() => {
    if (!didSucceed) {
      return;
    }

    const tickId = setInterval(() => {
      setSecondsUntilRedirect((current) => Math.max(0, current - 1));
    }, 1000);

    const redirectId = setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 2000);

    return () => {
      clearInterval(tickId);
      clearTimeout(redirectId);
    };
  }, [didSucceed, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ValidationErrors = {};

    if (!token) {
      nextErrors.token = "Este enlace no es válido o ya expiró.";
    }

    if (!strength.meetsPolicy) {
      nextErrors.password =
        "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.";
    }

    if (!confirmPassword || confirmPassword !== password) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await resetPassword({
      token,
      newPassword: password,
    });

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

    setIsSubmitting(false);
    setDidSucceed(true);
    setSecondsUntilRedirect(2);
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
              Creá una nueva contraseña
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
              <h1 className="mt-4 font-[family-name:Georgia] text-[1.35rem] font-bold leading-tight text-[#FAF8F5]">
                Creá una nueva contraseña
              </h1>
              <p className="mx-auto mt-4 max-w-[370px] font-[family-name:Georgia] text-base italic leading-relaxed text-[#D7DCE3] lg:mx-0 lg:max-w-xs lg:text-sm">
                Definí una contraseña segura para volver a ingresar a tu cuenta.
              </p>
            </div>

            <p className="relative z-10 mt-10 text-[0.66rem] text-[#8EA0B6] lg:mt-0">mathesis.social</p>
          </div>

          <div
            className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:justify-center lg:px-14 lg:py-14"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="w-full lg:mx-auto lg:max-w-[440px]">
              {errors.token ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {errors.token}
                </p>
              ) : null}

              {didSucceed ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
                  <h2
                    className="font-[family-name:Georgia] text-[1.35rem] font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Contraseña actualizada correctamente
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Te redirigimos a iniciar sesión en {secondsUntilRedirect} segundo
                    {secondsUntilRedirect === 1 ? "" : "s"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      router.replace("/login");
                      router.refresh();
                    }}
                    className="mt-2 w-full rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95"
                    style={{ backgroundColor: "var(--brand-500)" }}
                  >
                    Ir ahora a iniciar sesión
                  </button>
                </div>
              ) : (
              <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-bold tracking-wide lg:text-xs"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Nueva contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : "password-help"}
                    className="rounded-2xl border-[1.5px] px-5 py-3 text-base outline-none transition lg:rounded-lg lg:px-3.5 lg:py-2.5 lg:text-sm"
                    style={{
                      borderColor: "var(--line)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--surface)",
                    }}
                  />

                  <div className="mt-1 grid grid-cols-3 gap-2" aria-label={`Nivel de seguridad: ${strength.strength}`}>
                    <span
                      className="h-2 rounded-full"
                      style={{ backgroundColor: semaphoreColors[0] }}
                    />
                    <span
                      className="h-2 rounded-full"
                      style={{ backgroundColor: semaphoreColors[1] }}
                    />
                    <span
                      className="h-2 rounded-full"
                      style={{ backgroundColor: semaphoreColors[2] }}
                    />
                  </div>

                  <p id="password-help" className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial (ej: ! @ # $).
                  </p>

                  {errors.password ? (
                    <p id="password-error" className="text-sm font-medium text-red-600">
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-bold tracking-wide lg:text-xs"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Repetir nueva contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    className="rounded-2xl border-[1.5px] px-5 py-3 text-base outline-none transition lg:rounded-lg lg:px-3.5 lg:py-2.5 lg:text-sm"
                    style={{
                      borderColor: "var(--line)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--surface)",
                    }}
                  />
                  {errors.confirmPassword ? (
                    <p id="confirm-password-error" className="text-sm font-medium text-red-600">
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: "var(--brand-500)" }}
                >
                  {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </form>
              )}
            </div>
          </div>
        </section>

        <p className="border-t border-[var(--line)] py-2 text-center text-[0.65rem] tracking-wide text-[var(--text-soft)]">
          Powered by <span className="font-semibold text-[var(--brand-700)]">Newen.solutions</span>
        </p>
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "var(--background)", color: "var(--text-secondary)" }}
        >
          <p className="text-sm">Cargando...</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
