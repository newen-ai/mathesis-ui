"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasSession } from "@/lib/api/auth";

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

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const loginPath = useMemo(() => buildLoginPath(pathname), [pathname]);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const authenticated = await hasSession();
      if (!isMounted) return;

      setIsAuthenticated(authenticated);
      setIsCheckingSession(false);

      if (!authenticated) {
        router.replace(loginPath);
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [loginPath, router]);

  if (isCheckingSession || !isAuthenticated) {
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
