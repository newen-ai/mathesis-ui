"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listMyBlockedUsers, type BlockedUserSummary, unblockUser } from "@/lib/api/block";
import { getTwoInitials } from "@/lib/utils/name";
import { TopBar } from "../../../_components/TopBar";
import { navItems } from "../../../_lib/constants";

type BlockedUser = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  blockedAt: string;
  reasonNote: string | null;
};

function formatBlockedAt(isoValue: string): string {
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function mapBlockedUser(source: BlockedUserSummary): BlockedUser {
  return {
    userId: source.userId,
    firstName: source.firstName,
    lastName: source.lastName,
    profileImageUrl: source.profileImageUrl,
    blockedAt: source.blockedAt,
    reasonNote: source.reasonNote
  };
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUnblockUserId, setActiveUnblockUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadBlockedUsers = async () => {
      try {
        const response = await listMyBlockedUsers(controller.signal);
        if (cancelled) {
          return;
        }

        setBlockedUsers(response.data.blockedUsers.map(mapBlockedUser));
      } catch {
        if (cancelled) {
          return;
        }

        toast.error("No pudimos cargar tu lista de bloqueados.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBlockedUsers();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const blockedUsersCountLabel = useMemo(() => {
    if (blockedUsers.length === 0) {
      return "0 usuarios";
    }

    return `${blockedUsers.length} ${blockedUsers.length === 1 ? "usuario" : "usuarios"}`;
  }, [blockedUsers.length]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/account/configuration");
  };

  const handleUnblock = async (userId: string) => {
    setActiveUnblockUserId(userId);

    try {
      await unblockUser(userId);
      setBlockedUsers((current) => current.filter((user) => user.userId !== userId));
      toast.success("Usuario desbloqueado");
    } catch {
      toast.error("No pudimos desbloquear al usuario.");
    } finally {
      setActiveUnblockUserId(null);
    }
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
            {isLoading ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[1.02rem] text-[var(--text-secondary)]">Cargando bloqueados...</p>
              </div>
            ) : null}

            {!isLoading && blockedUsers.length > 0 ? (
              blockedUsers.map((user) => (
                <article key={user.userId} className="flex flex-wrap items-start gap-4 px-5 py-5 sm:flex-nowrap">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-lg font-semibold text-[var(--surface)]">
                    {getTwoInitials({
                      fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
                      fallback: "M"
                    })}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1rem] font-semibold leading-none text-[var(--text-primary)]">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuario"}
                    </p>
                    <p className="mt-1 text-[1.04rem] text-[var(--text-secondary)]">
                      Bloqueado el {formatBlockedAt(user.blockedAt)}
                    </p>
                    {user.reasonNote ? (
                      <p className="mt-2 max-w-[520px] border-b border-dashed border-[var(--line)] pb-1 text-[1.02rem] italic text-[var(--text-secondary)]">
                        {user.reasonNote}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={activeUnblockUserId === user.userId}
                    onClick={() => handleUnblock(user.userId)}
                    className="shrink-0 rounded-xl border border-[var(--line)] px-4 py-2 text-[0.95rem] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                  >
                    {activeUnblockUserId === user.userId ? "Desbloqueando..." : "Desbloquear"}
                  </button>
                </article>
              ))
            ) : !isLoading ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[1.1rem] font-semibold text-[var(--text-primary)]">
                  No tenés usuarios bloqueados.
                </p>
                <p className="mt-2 text-[0.98rem] text-[var(--text-secondary)]">
                  Cuando bloquees a alguien, va a aparecer acá junto con tu nota de referencia.
                </p>
              </div>
            ) : null}
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
              El bloqueo es mutuo mientras esté activo. Actualmente tenés {blockedUsersCountLabel} bloqueados.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
