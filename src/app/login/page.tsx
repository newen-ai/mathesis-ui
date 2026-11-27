"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SharedBrandedLoginScreen } from "@kenrou/shared-ui";
import { getSessionAccessDecision, login } from "@/lib/api/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  resolveLoginSuccessRedirect,
  sanitizeLoginNextPath,
} from "@/lib/auth/login-redirect";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { BRAND_LOGO_FULL_SRC, BRAND_LOGO_SRC } from "@/lib/assets";
import { extractAuthErrorCode, getAuthErrorTranslation, isCaptchaError } from "@/lib/i18n/auth-errors";
import { useTurnstile } from "@/components/auth/TurnstileWidget";
import { normalizeEmailInput } from "@/lib/utils/email";

function resolveLoginErrorMessage(
  message: string | undefined,
  details: unknown,
  fallbackMessage: string
): string {
  if (details) {
    const translated = getAuthErrorTranslation(details, message || fallbackMessage);
    if (translated) {
      return translated;
    }
  }

  if (message) {
    const translated = getAuthErrorTranslation(message, message);
    if (translated && translated !== message) {
      return translated;
    }
  }

  return message?.trim() || fallbackMessage;
}

function LoginPageContent() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    return sanitizeLoginNextPath(candidate);
  }, [searchParams]);

  const initialEmail = useMemo(() => {
    const candidate = searchParams.get("email");
    return normalizeEmailInput(candidate);
  }, [searchParams]);

  useRedirectIfAuthenticated(nextPath);

  // The backend asks for the CAPTCHA only after a few failed attempts (CAPTCHA_REQUIRED); from then on the
  // widget stays under the password field and every attempt sends a fresh token.
  const [isCaptchaRequired, setIsCaptchaRequired] = useState(false);
  const captcha = useTurnstile("mt-3 flex justify-center");

  const renderPasswordField = ({
    id,
    value,
    onChange,
    className,
    placeholder,
    autoComplete,
    hasError,
    ariaDescribedBy,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    autoComplete?: string;
    hasError?: boolean;
    ariaDescribedBy?: string;
  }) => (
    <>
      <PasswordInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        labels={{
          show: t("login.showPassword"),
          hide: t("login.hidePassword"),
        }}
        ariaLabels={{
          show: t("login.showPasswordAria"),
          hide: t("login.hidePasswordAria"),
        }}
        togglePaddingClassName="pr-16"
        toggleClassName="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A6435] hover:underline"
      />
      {isCaptchaRequired ? captcha.widget : null}
    </>
  );

  return (
    <SharedBrandedLoginScreen
      brandName="Sophium"
      logoSrc={BRAND_LOGO_SRC}
      logoLockupSrc={BRAND_LOGO_FULL_SRC}
      logoAlt={t("common.brandLogoAlt")}
      mobileTagline={t("login.screen.mobileTagline")}
      badgeLabel={t("login.screen.badgeLabel")}
      heroTitle={t("login.screen.heroTitle")}
      heroSubtitle={t("login.screen.heroSubtitle")}
      domainLabel={t("login.screen.domainLabel")}
      welcomeTitle={t("login.screen.welcomeTitle")}
      formProps={{
        initialEmail,
        normalizeEmail: normalizeEmailInput,
        login: (input) =>
          login({
            email: input.email,
            password: input.password,
            captchaToken: isCaptchaRequired ? captcha.token : null,
          }),
        onFailure: ({ result, input }) => {
          const authErrorCode = extractAuthErrorCode(result.details);

          if (isCaptchaRequired || isCaptchaError(result.details)) {
            // Show the widget (if it was not there yet) and get a fresh token for the next attempt.
            setIsCaptchaRequired(true);
            captcha.reset();
          }

          if (authErrorCode === "EMAIL_NOT_VERIFIED") {
            router.replace(`/unverified?email=${encodeURIComponent(input.email)}`);
            return true;
          }

          return false;
        },
        resolveFailureMessage: (result) =>
          resolveLoginErrorMessage(
            result.message,
            result.details,
            t("login.errorFallback")
          ),
        onSuccess: async () => {
          const accessDecision = await getSessionAccessDecision();
          const targetPath = resolveLoginSuccessRedirect(accessDecision, nextPath);

          // Use hard navigation to avoid chained App Router transitions after auth cookie writes.
          window.location.replace(targetPath);
        },
        forgotPasswordAction: () => router.push("/forgot-password"),
        messages: {
          emailLabel: t("login.emailLabel"),
          passwordLabel: t("login.passwordLabel"),
          submitLabel: t("login.submitLabel"),
          submittingLabel: t("login.submittingLabel"),
          invalidEmail: t("login.invalidEmail"),
          invalidPassword: t("login.invalidPassword"),
          genericError: t("login.genericError"),
          emailPlaceholder: t("login.emailPlaceholder"),
          passwordPlaceholder: t("login.passwordPlaceholder"),
          forgotPasswordLabel: t("login.forgotPasswordLabel")
        },
        renderPasswordField,
      }}
      footer={{
        membershipPrompt: t("login.footer.membershipPrompt"),
        registerHref: "/registro",
        registerLabel: t("login.footer.registerLabel"),
        nonMemberPrompt: t("login.footer.nonMemberPrompt"),
        nonMemberHref: "https://mensa.org",
        nonMemberLabel: t("login.footer.nonMemberLabel"),
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-white">
          <p className="text-center text-sm text-[#666666]">...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
