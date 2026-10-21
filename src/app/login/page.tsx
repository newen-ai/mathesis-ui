"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MathesisLoginScreen } from "@kenrou/shared-ui";
import { login } from "@/lib/api/auth";
import { useRedirectIfAuthenticated } from "@/lib/auth/useRedirectIfAuthenticated";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { extractAuthErrorCode, getAuthErrorTranslation } from "@/lib/i18n/auth-errors";
import { normalizeEmailInput } from "@/lib/utils/email";

function isSafeInternalPath(path: string | null): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

function resolveLoginErrorMessage(message?: string, details?: unknown): string {
  if (details) {
    const translated = getAuthErrorTranslation(details, message || "No pudimos iniciar sesión.");
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

  return message?.trim() || "No pudimos iniciar sesión.";
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
    return normalizeEmailInput(candidate);
  }, [searchParams]);

  useRedirectIfAuthenticated(nextPath);

  return (
    <MathesisLoginScreen
      logoSrc={BRAND_LOGO_SRC}
      logoAlt="Logo Mathesis"
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
          resolveLoginErrorMessage(result.message, result.details),
        onSuccess: () => {
          router.replace(nextPath);
          router.refresh();
        },
        forgotPasswordAction: () => router.push("/forgot-password"),
        messages: {
          emailLabel: "Mail",
          passwordLabel: "Contraseña",
          submitLabel: "Ingresar",
          submittingLabel: "Ingresando...",
          invalidEmail: "Ingresa un email válido.",
          invalidPassword: "La clave debe tener al menos 8 caracteres.",
          genericError: "No pudimos iniciar sesión.",
          emailPlaceholder: "tu@mail.com",
          passwordPlaceholder: "••••••••",
          forgotPasswordLabel: "¿Olvidaste tu contraseña?"
        }
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100dvh-2.5rem)] items-center justify-center bg-white font-[family-name:Arial] md:min-h-[calc(100dvh-2.75rem)]">
          <p className="text-center text-sm text-[#666666]">Cargando...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
