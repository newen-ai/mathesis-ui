"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSessionAccessDecision, type SessionState } from "@/lib/api/auth";

type SessionGateProps = {
  children: ReactNode;
};

function buildLoginPath(pathname: string) {
  const loginPath = new URLSearchParams();
  if (pathname && pathname !== "/") {
    loginPath.set("next", pathname);
  }

  const queryString = loginPath.toString();
  return queryString ? `/login?${queryString}` : "/login";
}

const FALLBACK_WHITELIST_PATH = "/whitelist-access";

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionState, setSessionState] = useState<SessionState | "checking">(
    "checking"
  );
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const loginPath = useMemo(() => buildLoginPath(pathname), [pathname]);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const accessDecision = await getSessionAccessDecision();
      const nextSessionState = accessDecision.sessionState;
      if (!isMounted) return;

      setSessionState(nextSessionState);

      if (nextSessionState === "unauthenticated") {
        setIsCheckingSession(false);
        router.replace(loginPath);
        return;
      }

      if (
        nextSessionState === "authenticated" &&
        accessDecision.role !== "admin" &&
        !accessDecision.isWhitelisted
      ) {
        setIsCheckingSession(false);
          router.replace(FALLBACK_WHITELIST_PATH);
        return;
      }

      setIsCheckingSession(false);
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [loginPath, router]);

  if (isCheckingSession || sessionState === "checking") {
    return (
      <div className="mathesis-shell flex min-h-screen items-center justify-center px-4">
        <div className="mathesis-card w-full max-w-md p-6 text-center">
          <p className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
            Verificando sesion
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Estamos validando tu acceso seguro a Mathesis.
          </p>
        </div>
      </div>
    );
  }

  if (sessionState === "unauthenticated") {
    return null;
  }

  return (
    <>
      {sessionState === "unknown" ? (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50/95 px-4 py-1 text-center text-xs font-medium text-amber-700 backdrop-blur-sm">
          Reconectando sesion...
        </div>
      ) : null}
      {children}
    </>
  );
}
