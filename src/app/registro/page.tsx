"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { register } from "@/lib/api/auth";
import { formatApiErrorDetails } from "@/lib/api/client";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ServiceErrorPopup } from "@/components/ui/ServiceErrorPopup";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { normalizeEmailInput } from "@/lib/utils/email";

type ValidationErrors = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
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
  const { t } = useTranslation("auth");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  // Paso 1 — verificación de membresía
  const [organization, setOrganization] = useState(t("register.organizationMensa"));
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [isAdult, setIsAdult] = useState(false);

  // Paso 2 — crear acceso
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      nextErrors.dni = t("register.errors.dniInvalid");
    }
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      nextErrors.email = t("register.errors.emailInvalid");
    }
    if (!isAdult) {
      nextErrors.adult = t("register.errors.adultRequired");
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

    if (!firstName.trim()) {
      nextErrors.firstName = t("register.errors.firstNameRequired");
    }
    if (middleName.trim().length > 80) {
      nextErrors.middleName = t("register.errors.middleNameTooLong");
    }
    if (!lastName.trim()) {
      nextErrors.lastName = t("register.errors.lastNameRequired");
    }

    if (!password || password.length < 8) {
      nextErrors.password = t("register.errors.passwordTooShort");
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("register.errors.passwordMismatch");
    }
    if (!acceptedTerms) {
      nextErrors.terms = t("register.errors.termsRequired");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
    });

    if (!result.success) {
      setErrors({ general: result.message });
      setPopupInfo({
        title: t("common.serviceErrorTitle"),
        message: result.message,
        details: formatApiErrorDetails(result.details, result.status),
      });
      setIsSubmitting(false);
      return;
    }

    router.replace(`/registro/enviado?email=${encodeURIComponent(normalizedEmail)}`);
    router.refresh();
  };

  const stepLabel =
    step === 1 ? t("register.step1Label") : t("register.step2Label");
  const stepTitle = step === 1 ? t("register.step1Title") : t("register.step2Title");
  const formHeading = step === 1 ? t("register.formHeadingStep1") : t("register.formHeadingStep2");
  const formSub =
    step === 1
      ? t("register.formSubStep1")
      : t("register.formSubStep2");

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
                alt={t("common.brandLogoAlt")}
                width={32}
                height={32}
                loading="eager"
                decoding="async"
                className="h-8 w-8"
              />
              <span className="font-[family-name:Georgia] text-lg font-bold tracking-[0.1em] text-[#FAF8F5]">
                Sophium
              </span>
            </div>

            {/* Mobile: flecha + eyebrow */}
            <div className="mb-1 flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onBack}
                aria-label={t("register.backAria")}
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
                    {t("register.desktopIntroTitle")}
                  </div>
                  <div className="mt-4 text-sm leading-relaxed text-[#FAF8F5]/70 lg:mx-auto lg:max-w-xs">
                    {t("register.desktopIntroBody")}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 font-[family-name:Georgia] text-2xl font-bold leading-snug text-[#FAF8F5]">
                    {t("register.welcomeTitle")}
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
                    {t("register.membershipVerified")}
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
                  {t("register.stepVerification")}
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
                  {t("register.stepPassword")}
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
                    {t("register.mobileStep1Intro")}
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="organization" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      {t("register.organizationLabel")}
                    </label>
                    <select
                      id="organization"
                      value={organization}
                      onChange={(event) => setOrganization(event.target.value)}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    >
                      <option value={t("register.organizationMensa")}>{t("register.organizationMensa")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dni" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      {t("register.dniLabel")}
                    </label>
                    <input
                      id="dni"
                      inputMode="numeric"
                      placeholder={t("register.dniPlaceholder")}
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
                      {t("register.emailLabel")}
                    </label>
                    <input
                      id="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={t("register.emailPlaceholder")}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    <p className="text-[0.7rem] leading-relaxed text-[#666666]">
                      {t("register.emailHelp")}
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
                    {t("register.adultLabel")}
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
                    {t("register.verifyAndContinue")}
                  </button>

                  <p className="rounded-lg bg-white px-3 py-2 text-[0.7rem] leading-relaxed text-[#666666] lg:bg-[#FAF8F5]">
                    {t("register.step1Footnote")}
                  </p>

                  <p className="text-center text-xs text-[#666666]">
                    {t("register.alreadyHaveAccount")}{" "}
                    <Link href="/login" className="font-bold text-[#7A6435] hover:underline">
                      {t("register.loginLink")}
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
                      {t("register.membershipVerified")}
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-[#0A2540]">{email}</div>
                    <div className="text-xs text-[#666666]">{organization}</div>
                  </div>

                  <div className="grid gap-2.5 lg:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="firstName" className="text-xs font-bold tracking-wide text-[#0A2540]">
                        {t("register.firstNameLabel")}
                      </label>
                      <input
                        id="firstName"
                        autoComplete="given-name"
                        placeholder={t("register.firstNamePlaceholder")}
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={errors.firstName ? "first-name-error" : undefined}
                        className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                      />
                      {errors.firstName ? (
                        <p id="first-name-error" className="text-xs font-medium text-red-700">
                          {errors.firstName}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="middleName" className="text-xs font-bold tracking-wide text-[#0A2540]">
                        {t("register.middleNameLabel")}
                      </label>
                      <input
                        id="middleName"
                        autoComplete="additional-name"
                        placeholder={t("register.middleNamePlaceholder")}
                        value={middleName}
                        onChange={(event) => setMiddleName(event.target.value)}
                        aria-invalid={Boolean(errors.middleName)}
                        aria-describedby={errors.middleName ? "middle-name-error" : undefined}
                        className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                      />
                      {errors.middleName ? (
                        <p id="middle-name-error" className="text-xs font-medium text-red-700">
                          {errors.middleName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      {t("register.lastNameLabel")}
                    </label>
                    <input
                      id="lastName"
                      autoComplete="family-name"
                      placeholder={t("register.lastNamePlaceholder")}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={errors.lastName ? "last-name-error" : undefined}
                      className="rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    {errors.lastName ? (
                      <p id="last-name-error" className="text-xs font-medium text-red-700">
                        {errors.lastName}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      {t("register.passwordLabel")}
                    </label>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder={t("register.passwordPlaceholder")}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      className="w-full rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
                    <p className="text-[0.7rem] leading-relaxed text-[#666666]">
                      {t("register.passwordHelp")}
                    </p>
                    {errors.password ? (
                      <p className="text-xs font-medium text-red-700">{errors.password}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-[#0A2540]">
                      {t("register.confirmPasswordLabel")}
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      placeholder={t("register.passwordPlaceholder")}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className="w-full rounded-lg border-[1.5px] border-[#E8E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]"
                    />
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
                      {t("register.termsPrefix")}{" "}
                      <span className="font-semibold text-[#7A6435] hover:underline">
                        {t("register.termsLink")}
                      </span>{" "}
                      {t("register.termsMiddle")}{" "}
                      <span className="font-semibold text-[#7A6435] hover:underline">
                        {t("register.privacyLink")}
                      </span>{" "}
                      {t("register.termsSuffix")}
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
                    {isSubmitting ? t("register.creatingAccount") : t("register.createAccount")}
                  </button>

                  <p className="text-center text-xs italic text-[#666666]">
                    {t("register.step2Tagline")}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
