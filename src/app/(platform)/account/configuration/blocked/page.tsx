"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getTwoInitials } from "@/lib/utils/name";
import { TopBar } from "../../../_components/TopBar";
import { navItems } from "../../../_lib/constants";

type BlockedUser = {
  id: string;
  fullName: string;
  blockedAt: string;
  reasonNote: string;
};

const EXAMPLE_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "blocked-1",
    fullName: "Diego Fernández",
    blockedAt: "22/06/2026",
    reasonNote: "Comentarios despectivos repetidos en el Feed.",
  },
];

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(EXAMPLE_BLOCKED_USERS);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/account/configuration");
  };

  const handleUnblock = (userId: string) => {
    setBlockedUsers((current) => current.filter((user) => user.id !== userId));
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7 lg:px-10 lg:py-8">
        <section className="min-w-0 border-r-0 lg:border-r lg:border-[var(--line)] lg:pr-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Volver a configuración"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--navy-900)] transition hover:bg-[var(--surface-2)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="m14.5 5.5-7 6.5 7 6.5" />
              </svg>
            </button>
            <h1 className="font-[family-name:var(--font-spectral)] text-[1.75rem] font-semibold leading-none text-[var(--navy-900)]">
              Bloqueados
            </h1>
          </div>

          <div className="mt-6 rounded-xl border border-[color:color-mix(in_srgb,var(--danger-500)_28%,var(--line))] bg-[color:color-mix(in_srgb,var(--danger-500)_8%,var(--surface))] px-5 py-4 text-[1.03rem] leading-relaxed text-[color:color-mix(in_srgb,var(--danger-500)_88%,#8a2f1d)]">
            Bloquear a alguien impide que te envíe mensajes directos, vea tu actividad reciente o te encuentre en la búsqueda de miembros. La otra persona no recibe ninguna notificación de que la bloqueaste. Podés desbloquear cuando quieras.
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {blockedUsers.length > 0 ? (
              blockedUsers.map((user) => (
                <article key={user.id} className="flex flex-wrap items-start gap-4 px-5 py-5 sm:flex-nowrap">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6e3d8e] text-lg font-semibold text-white">
                    {getTwoInitials({ fullName: user.fullName, fallback: "M" })}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1rem] font-semibold leading-none text-[var(--text-primary)]">
                      {user.fullName}
                    </p>
                    <p className="mt-1 text-[1.04rem] text-[var(--text-secondary)]">
                      Bloqueado el {user.blockedAt}
                    </p>
                    <p className="mt-2 max-w-[520px] border-b border-dashed border-[var(--line)] pb-1 text-[1.02rem] italic text-[var(--text-secondary)]">
                      {user.reasonNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id)}
                    className="shrink-0 rounded-xl border border-[var(--line)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                  >
                    Desbloquear
                  </button>
                </article>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-[1.1rem] font-semibold text-[var(--text-primary)]">
                  No tenés usuarios bloqueados.
                </p>
                <p className="mt-2 text-[0.98rem] text-[var(--text-secondary)]">
                  Cuando bloquees a alguien, va a aparecer acá junto con tu nota de referencia.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="mt-6 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="font-[family-name:var(--font-spectral)] text-[2rem] font-semibold leading-tight text-[var(--navy-900)]">
              Qué NO puede hacer un contacto bloqueado
            </h2>
            <p className="mt-4 text-[1.06rem] leading-relaxed text-[var(--text-primary)]">
              Enviarte mensajes directos · Ver tu actividad reciente · Encontrarte en la búsqueda de miembros
            </p>
            <div className="my-4 border-t border-[var(--line)]" />
            <p className="text-[1rem] leading-relaxed text-[var(--text-secondary)]">
              El bloqueo es mutuo: mientras dure, tampoco vos podés hacer estas cosas con esa persona.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
