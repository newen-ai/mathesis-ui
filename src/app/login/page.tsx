"use client";

import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SharedBrandedLoginScreen } from "@kenrou/shared-ui";
import { login } from "@/lib/api/auth";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { extractAuthErrorCode, getAuthErrorTranslation } from "@/lib/i18n/auth-errors";
import { normalizeEmailInput } from "@/lib/utils/email";

type LoginPasswordFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
  ariaDescribedBy?: string;
  showLabel: string;
  hideLabel: string;
  showAriaLabel: string;
  hideAriaLabel: string;
};

function LoginPasswordField({
  id,
  value,
  onChange,
  className,
  placeholder,
  autoComplete,
  hasError,
  ariaDescribedBy,
  showLabel,
  hideLabel,
  showAriaLabel,
  hideAriaLabel,
}: LoginPasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        className={`${className ?? ""} w-full pr-16`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A6435] hover:underline"
        aria-label={isVisible ? hideAriaLabel : showAriaLabel}
      >
        {isVisible ? hideLabel : showLabel}
      </button>
    </div>
  );
}

function isSafeInternalPath(path: string | null): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

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
    return isSafeInternalPath(candidate) ? candidate : "/";
  }, [searchParams]);

  const initialEmail = useMemo(() => {
    const candidate = searchParams.get("email");
    return normalizeEmailInput(candidate);
  }, [searchParams]);

  useRedirectIfAuthenticated(nextPath);

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
    <LoginPasswordField
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      autoComplete={autoComplete}
      hasError={hasError}
      ariaDescribedBy={ariaDescribedBy}
      showLabel={t("login.showPassword")}
      hideLabel={t("login.hidePassword")}
      showAriaLabel={t("login.showPasswordAria")}
      hideAriaLabel={t("login.hidePasswordAria")}
    />
  );

  return (
    <SharedBrandedLoginScreen
      brandName="Mathesis"
      logoSrc={BRAND_LOGO_SRC}
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
        login: (input) => login({ email: input.email, password: input.password }),
        onFailure: ({ result, input }) => {
          const authErrorCode = extractAuthErrorCode(result.details);

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
        onSuccess: () => {
          router.replace(nextPath);
          router.refresh();
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
  const isClientReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!isClientReady) {
    return (
      <main className="flex min-h-[calc(100dvh-2.5rem)] items-center justify-center bg-white font-[family-name:Arial] md:min-h-[calc(100dvh-2.75rem)]">
        <p className="text-center text-sm text-[#666666]">...</p>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100dvh-2.5rem)] items-center justify-center bg-white font-[family-name:Arial] md:min-h-[calc(100dvh-2.75rem)]">
          <p className="text-center text-sm text-[#666666]">...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
