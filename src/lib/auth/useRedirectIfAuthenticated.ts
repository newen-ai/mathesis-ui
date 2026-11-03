"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSessionState } from "@/lib/api/auth";

type RedirectCheckState = {
  isChecking: boolean;
  isAuthenticated: boolean;
};

export function useRedirectIfAuthenticated(destination: string) {
  const pathname = usePathname();
  const [state, setState] = useState<RedirectCheckState>({
    isChecking: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const sessionState = await getSessionState();
      if (!isMounted) return;

      if (sessionState === "authenticated") {
        setState({ isChecking: false, isAuthenticated: true });

        if (pathname !== destination) {
          window.location.replace(destination);
        }

        return;
      }

      setState({ isChecking: false, isAuthenticated: false });
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [destination, pathname]);

  return state;
}
