"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeWelcomeOnboarding } from "@/lib/api/auth";

export function WelcomeFinishButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await completeWelcomeOnboarding();

    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/ateneo");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-scale-2 font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={isSubmitting}
        className="flex min-h-16 w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 text-center text-[1.35rem] font-semibold text-[var(--on-brand)] transition hover:bg-[var(--brand-300)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Abriendo Ateneo..." : "Empezar a explorar"}
      </button>
    </div>
  );
}