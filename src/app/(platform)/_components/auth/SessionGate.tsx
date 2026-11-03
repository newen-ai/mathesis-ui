"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSessionAccessDecision, type SessionState } from "@/lib/api/auth";
import {
  buildLoginPath,
  normalizePathname,
  resolveSessionGateRedirect,
} from "@/lib/auth/session-gate-redirect";

type SessionGateProps = {
  children: ReactNode;
};

export function SessionGate({ children }: SessionGateProps) {
  const pathname = usePathname();
  const [sessionState, setSessionState] = useState<SessionState | "checking">(
    "checking"
  );
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const loginPath = useMemo(() => buildLoginPath(pathname), [pathname]);

  useEffect(() => {
    let isMounted = true;
    const replaceLocation = (targetPath: string) => {
      if (normalizePathname(pathname) === normalizePathname(targetPath)) {
        return;
      }

      window.location.replace(targetPath);
    };
    const finishAndRedirect = (targetPath: string) => {
      setIsCheckingSession(false);
      replaceLocation(targetPath);
    };

    const verifySession = async () => {
      const accessDecision = await getSessionAccessDecision();
      const nextSessionState = accessDecision.sessionState;
      if (!isMounted) return;

      setSessionState(nextSessionState);

      const redirectTarget = resolveSessionGateRedirect(
        accessDecision,
        pathname,
        loginPath
      );

      if (redirectTarget) {
        finishAndRedirect(redirectTarget);
        return;
      }

      setIsCheckingSession(false);
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [loginPath, pathname]);

  if (isCheckingSession || sessionState === "checking") {
    return (
      <div className="sophium-shell flex min-h-screen items-center justify-center px-4">
        <div className="sophium-card w-full max-w-md p-6 text-center">
          <p className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
            Verificando sesion
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Estamos validando tu acceso seguro a Sophium.
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
