"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/api/auth";

export function useRedirectIfAuthenticated(destination: string) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const authenticated = await hasSession();
      if (!isMounted) return;

      if (authenticated) {
        router.replace(destination);
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [destination, router]);
}
