"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/api/auth";

type ConfirmClientProps = {
  token: string;
};

export function ConfirmClient({ token }: ConfirmClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmando tu correo...");

  useEffect(() => {
    const resolvedToken =
      token.trim() || new URLSearchParams(window.location.search).get("token")?.trim() || "";

    void verifyEmail(resolvedToken).then((result) => {
      if (result.success) {
        setStatus("success");
        setMessage("Tu correo ya fue verificado correctamente. Te estamos llevando a la bienvenida.");
        return;
      }

      setStatus("error");
      setMessage(result.message || "No pudimos confirmar tu correo.");
    });
  }, [token]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/bienvenida");
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Confirmación de email
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          {status === "success" ? "Correo verificado" : "Confirmando tu cuenta"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        {status === "success" ? (
          <Link
            href="/bienvenida"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163a5b]"
          >
            Ir a la bienvenida
          </Link>
        ) : null}
      </section>
    </main>
  );
}