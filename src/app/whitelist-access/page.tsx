"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { logout, requestWhitelistAccess } from "@/lib/api/auth";
import { apiRequest } from "@/lib/api/client";

export default function WhitelistAccessPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetryingAccess, setIsRetryingAccess] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    const result = await requestWhitelistAccess(note.trim() ? note.trim() : undefined);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message || t("whitelist.requestError"));
      return;
    }

    toast.success(t("whitelist.requestSuccess"));
  };

  const onGoToLogin = async () => {
    setIsLoggingOut(true);
    const result = await logout();
    if (!result.success) {
      toast.warning(t("whitelist.logoutError"));
    }
    router.replace("/login");
  };

  const onRetryAccess = async () => {
    setIsRetryingAccess(true);
    try {
      const response = await apiRequest("/profile/me");

      if (response.ok) {
        router.replace("/");
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        let code: string | undefined;

        try {
          const payload = (await response.json()) as { details?: { code?: string } };
          code = payload.details?.code;
        } catch {
          code = undefined;
        }

        if (code === "USER_NOT_WHITELISTED") {
          toast.warning(t("whitelist.notInWhitelist"));
          return;
        }
      }

      toast.warning(t("whitelist.notInWhitelist"));
    } catch {
      toast.error(t("whitelist.retryError"));
    } finally {
      setIsRetryingAccess(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4EFE8] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#DCCFBF] bg-[#FFFCF8] p-6 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8D6E3E]">{t("whitelist.eyebrow")}</p>
        <h1 className="mt-2 font-[family-name:Georgia] text-3xl font-bold text-[#1D2A3A]">
          {t("whitelist.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4A5565]">
          {t("whitelist.description")}
        </p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label htmlFor="whitelist-note" className="block text-xs font-semibold uppercase tracking-wide text-[#4A5565]">
            {t("whitelist.noteLabel")}
          </label>
          <textarea
            id="whitelist-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder={t("whitelist.notePlaceholder")}
            className="w-full rounded-xl border border-[#DCCFBF] bg-white px-3 py-2 text-sm text-[#1D2A3A] outline-none transition focus:border-[#8D6E3E]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-[#8D6E3E] px-5 py-2 text-sm font-semibold text-[#FFFCF8] transition hover:bg-[#7A5E36] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t("whitelist.requestingAccess") : t("whitelist.requestAccess")}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#4A5565]">
          <button
            type="button"
            onClick={onGoToLogin}
            disabled={isLoggingOut}
            className="font-semibold text-[#8D6E3E] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingOut ? t("whitelist.loggingOut") : t("whitelist.goToLogin")}
          </button>
          <span aria-hidden>•</span>
          <button
            type="button"
            onClick={onRetryAccess}
            disabled={isRetryingAccess}
            className="font-semibold text-[#8D6E3E] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRetryingAccess ? t("whitelist.retryingAccess") : t("whitelist.retryAccess")}
          </button>
        </div>
      </div>
    </main>
  );
}
