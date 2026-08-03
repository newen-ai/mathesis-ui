"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestWhitelistAccess } from "@/lib/api/auth";

type RequestState = {
  type: "idle" | "success" | "error";
  message?: string;
};

export default function WhitelistAccessPage() {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>({ type: "idle" });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    const result = await requestWhitelistAccess(note.trim() ? note.trim() : undefined);
    setIsSubmitting(false);

    if (!result.success) {
      setRequestState({
        type: "error",
        message: result.message
      });
      return;
    }

    setRequestState({
      type: "success",
      message: "Solicitud enviada. Te avisaremos cuando tu acceso sea aprobado."
    });
  };

  return (
    <main className="min-h-screen bg-[#F4EFE8] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#DCCFBF] bg-[#FFFCF8] p-6 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8D6E3E]">Whitelist activa</p>
        <h1 className="mt-2 font-[family-name:Georgia] text-3xl font-bold text-[#1D2A3A]">
          Tu cuenta esta pendiente de aprobacion
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4A5565]">
          Iniciaste sesion correctamente, pero este entorno temporal solo permite acceso a correos
          whitelisteados. Puedes solicitar acceso desde este formulario.
        </p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label htmlFor="whitelist-note" className="block text-xs font-semibold uppercase tracking-wide text-[#4A5565]">
            Mensaje para el equipo (opcional)
          </label>
          <textarea
            id="whitelist-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Ej: Soy parte del equipo QA y necesito acceso para pruebas de mensajeria"
            className="w-full rounded-xl border border-[#DCCFBF] bg-white px-3 py-2 text-sm text-[#1D2A3A] outline-none transition focus:border-[#8D6E3E]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-[#8D6E3E] px-5 py-2 text-sm font-semibold text-[#FFFCF8] transition hover:bg-[#7A5E36] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Enviando..." : "Solicitar acceso"}
          </button>
        </form>

        {requestState.type === "success" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {requestState.message}
          </p>
        ) : null}
        {requestState.type === "error" ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {requestState.message ?? "No pudimos enviar tu solicitud."}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#4A5565]">
          <Link href="/login" className="font-semibold text-[#8D6E3E] underline-offset-4 hover:underline">
            Ir al login
          </Link>
          <span aria-hidden>•</span>
          <Link href="/" className="font-semibold text-[#8D6E3E] underline-offset-4 hover:underline">
            Reintentar acceso
          </Link>
        </div>
      </div>
    </main>
  );
}
