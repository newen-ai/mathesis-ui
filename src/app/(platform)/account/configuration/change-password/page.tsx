"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { changePassword } from "@/lib/api/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { evaluatePasswordStrength } from "@/lib/utils/password";
import { TopBar } from "../../../_components/TopBar";
import { navItems } from "../../../_lib/constants";

type ValidationErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

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

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const strength = evaluatePasswordStrength(newPassword);

  const semaphoreColors =
    strength.strength === "weak"
      ? ["var(--danger-500)", "var(--line)", "var(--line)"]
      : strength.strength === "normal"
        ? ["var(--brand-500)", "var(--brand-500)", "var(--line)"]
        : ["#2E9F61", "#2E9F61", "#2E9F61"];

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

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = "Ingresá tu contraseña actual.";
    }

    if (!strength.meetsPolicy) {
      nextErrors.newPassword =
        "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.";
    }

    if (!confirmPassword || confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const response = await changePassword({
      currentPassword,
      newPassword
    });
    setIsSubmitting(false);

    if (response.success) {
      setDidSucceed(true);
      return;
    }

    setErrors({
      currentPassword: response.message?.toLowerCase().includes("current") ? response.message : undefined,
      newPassword: response.message?.toLowerCase().includes("password") && !response.message?.toLowerCase().includes("current") ? response.message : undefined,
      confirmPassword: undefined
    });
  };

  const inputClass =
    "w-full rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)] transition focus:border-[var(--brand-500)] lg:rounded-xl lg:px-4 lg:py-3 lg:text-[0.97rem]";

  const labelClass =
    "block text-[0.97rem] font-bold text-[var(--text-primary)] lg:text-[0.88rem]";

  const form = didSucceed ? (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
      <h2 className="font-[family-name:var(--font-spectral)] text-[1.6rem] font-semibold text-[var(--text-primary)]">
        Contraseña actualizada
      </h2>
      <p className="mt-2 text-[0.97rem] leading-relaxed text-[var(--text-secondary)]">
        Tu contraseña fue cambiada correctamente.
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
        <label htmlFor="currentPassword" className={labelClass}>
          Contraseña actual
        </label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          aria-invalid={Boolean(errors.currentPassword)}
          className={inputClass}
        />
        {errors.currentPassword ? (
          <p className="text-sm font-medium text-[var(--danger-500)]">{errors.currentPassword}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="newPassword" className={labelClass}>
            Contraseña nueva
          </label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(errors.newPassword)}
            className={inputClass}
          />
          {errors.newPassword ? (
            <p className="text-sm font-medium text-[var(--danger-500)]">{errors.newPassword}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className={labelClass}>
            Repetir contraseña nueva
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            className={inputClass}
          />
          {errors.confirmPassword ? (
            <p className="text-sm font-medium text-[var(--danger-500)]">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label={`Nivel de seguridad: ${strength.strength}`}>
        <span className="h-[5px] rounded-full transition-colors" style={{ backgroundColor: semaphoreColors[0] }} />
        <span className="h-[5px] rounded-full transition-colors" style={{ backgroundColor: semaphoreColors[1] }} />
        <span className="h-[5px] rounded-full transition-colors" style={{ backgroundColor: semaphoreColors[2] }} />
      </div>

      <p className="text-[0.92rem] leading-relaxed text-[var(--text-secondary)]">
        Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial (ej: ! @ # $).
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[var(--brand-500)] px-6 py-4 text-[1.05rem] font-bold text-[var(--navy-900)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 lg:py-3.5"
      >
        {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
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
          Cambiar contraseña
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
              Seguridad de tu cuenta
            </p>
            <h2 className="mt-3 font-[family-name:Georgia] text-[2rem] font-bold leading-tight text-[var(--navy-900)]">
              Tu contraseña, tu control.
            </h2>
            <p className="mt-4 font-[family-name:Georgia] text-[0.95rem] italic text-[var(--navy-800)]">
              Configuración → Acciones de cuenta
            </p>
          </div>

          <p className="relative z-10 text-[0.66rem] text-[var(--navy-700)]">mathesis.social</p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col justify-center bg-[var(--surface)] px-14 py-14">
          <div className="mx-auto w-full max-w-[520px]">
            <h1 className="font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-none text-[var(--navy-900)]">
              Cambiar contraseña
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
