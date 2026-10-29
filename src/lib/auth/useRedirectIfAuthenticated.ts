"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionState } from "@/lib/api/auth";

type RedirectCheckState = {
  isChecking: boolean;
  isAuthenticated: boolean;
};

export function useRedirectIfAuthenticated(destination: string) {
  const router = useRouter();
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
        router.replace(destination);
        return;
      }

      setState({ isChecking: false, isAuthenticated: false });
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [destination, router]);

  return state;
}
