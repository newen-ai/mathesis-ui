"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { logout } from "@/lib/api/auth";
import { getVerbumErrorCode, isVerbumSessionExpired } from "@/lib/api/verbum";

// The access token has no refresh flow: once it expires every request returns 401. Same handling as the
// top bar: clear the session and send the user to log in (their guesses are already saved server-side).
export function useEndExpiredSession(): () => Promise<void> {
  const { t } = useTranslation("games");
  const router = useRouter();

  return useCallback(async () => {
    toast(t("verbum.errors.sessionExpired"));
    await logout();
    router.replace("/login");
    router.refresh();
  }, [router, t]);
}

export type VerbumRequest<T> = {
  data: T | null;
  // Replaces the loaded data, e.g. with the state a guess returned.
  setData: (data: T) => void;
  // Backend error code (VERBUM_*) or "LOAD_FAILED"; null while loading or after success.
  errorCode: string | null;
  isLoading: boolean;
  reload: () => void;
};

// Loads Verbum data once per `key` (and on reload), cancelling stale requests. An expired session sends the
// player to log in instead of surfacing an error.
export function useVerbumRequest<T>(key: string, load: (signal: AbortSignal) => Promise<T>): VerbumRequest<T> {
  const [data, setData] = useState<T | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const endExpiredSession = useEndExpiredSession();

  const runLoad = useEffectEvent((signal: AbortSignal) => load(signal));
  const onSessionExpired = useEffectEvent(() => {
    void endExpiredSession();
  });

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      setErrorCode(null);
      try {
        setData(await runLoad(controller.signal));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (isVerbumSessionExpired(error)) {
          onSessionExpired();
          return;
        }
        setErrorCode(getVerbumErrorCode(error) ?? "LOAD_FAILED");
      }
      setIsLoading(false);
    };

    void run();

    return () => controller.abort();
  }, [key, reloadToken]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  return { data, setData, errorCode, isLoading, reload };
}
