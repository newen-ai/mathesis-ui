"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionState } from "@/lib/api/auth";

export function useRedirectIfAuthenticated(destination: string) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const sessionState = await getSessionState();
      if (!isMounted) return;

      if (sessionState === "authenticated") {
        router.replace(destination);
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [destination, router]);
}
