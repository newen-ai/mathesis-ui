"use client";

import { ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasActiveSession } from "@/lib/auth/session";

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

function subscribeToSessionChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("focus", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("focus", handler);
  };
}

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasSession = useSyncExternalStore(
    subscribeToSessionChanges,
    hasActiveSession,
    () => false
  );

  const loginPath = useMemo(() => buildLoginPath(pathname), [pathname]);

  useEffect(() => {
    if (!hasSession) {
      router.replace(loginPath);
    }
  }, [hasSession, loginPath, router]);

  if (!hasSession) {
    return (
      <div className="linkedin-shell flex min-h-screen items-center justify-center px-4">
        <div className="linkedin-card w-full max-w-md p-6 text-center">
          <p className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
            Verificando sesion
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Estamos validando tu acceso seguro a Mensa Empresarios.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
