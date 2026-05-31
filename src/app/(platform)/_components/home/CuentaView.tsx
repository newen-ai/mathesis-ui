"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { AppCard } from "@/components/ui/AppCard";
import { readSession, setSessionName, updateRegisteredUserName } from "@/lib/auth/session";

type SessionSnapshot = ReturnType<typeof readSession>;

function subscribeToSessionChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSessionSnapshot(): SessionSnapshot {
  return readSession();
}

function splitDisplayName(fullName: string) {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);
  if (pieces.length === 0) {
    return { nombre: "", apellido: "" };
  }

  return {
    nombre: pieces[0] ?? "",
    apellido: pieces.slice(1).join(" "),
  };
}

export function CuentaView() {
  const session = useSyncExternalStore(subscribeToSessionChanges, getSessionSnapshot, () => null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!session) {
    return (
      <AppCard className="p-5 sm:p-6">
        <p className="text-sm text-slate-600">Cargando cuenta...</p>
      </AppCard>
    );
  }

  const initialName = splitDisplayName(session.user.name);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("nombre") ?? "").trim();
    const nextSurname = String(formData.get("apellido") ?? "").trim();

    if (!nextName || !nextSurname) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    setSessionName(nextName, nextSurname);
    updateRegisteredUserName(session.user.email, nextName, nextSurname);
    setSuccess("Datos actualizados correctamente.");
  };

  return (
    <AppCard className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Identidad
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-spectral)] text-2xl font-semibold text-slate-900">
          Perfil de cuenta
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Edita tu nombre y apellido para que se reflejen en la sesión y en tu cuenta mockeada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="mensa-field">
            Nombre
            <input
              name="nombre"
              type="text"
              defaultValue={initialName.nombre}
              autoComplete="given-name"
              placeholder="Ana"
            />
          </label>

          <label className="mensa-field">
            Apellido
            <input
              name="apellido"
              type="text"
              defaultValue={initialName.apellido}
              autoComplete="family-name"
              placeholder="Martinez"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/perfil"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al perfil
          </Link>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </AppCard>
  );
}
