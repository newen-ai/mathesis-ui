"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/AppCard";
import { ModulePage } from "@/app/(platform)/_components/ModulePage";
import { getSessionAccessDecision } from "@/lib/api/auth";
import {
  approveCompaniesBadgeRequest,
  checkCompaniesAdminAccess,
  getCompaniesBadgeRequests,
  getCompaniesMembers,
  rejectCompaniesBadgeRequest,
  removeCompaniesMember,
  type CompaniesBadgeRequestRow,
  type CompaniesMemberRow
} from "@/lib/api/admin";

type AccessState = "loading" | "allowed" | "denied";
type DeniedReason = "unauthenticated" | "forbidden" | null;
type CompaniesTab = "pending" | "approved";

const companiesTabs: Array<{ value: CompaniesTab; label: string; description: string }> = [
  {
    value: "pending",
    label: "Solicitudes pendientes",
    description: "Revisar y decidir"
  },
  {
    value: "approved",
    label: "Usuarios aprobados",
    description: "Gestión de membresía"
  }
];

export default function CompaniesAdminPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [deniedReason, setDeniedReason] = useState<DeniedReason>(null);
  const [activeTab, setActiveTab] = useState<CompaniesTab>("pending");
  const [pendingRequests, setPendingRequests] = useState<CompaniesBadgeRequestRow[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<CompaniesMemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      const decision = await getSessionAccessDecision();
      if (!isMounted) return;

      if (decision.sessionState !== "authenticated") {
        setAccessState("denied");
        setDeniedReason("unauthenticated");
        router.replace("/");
        return;
      }

      // Probe the backend — this is the authoritative check since ME admins
      // have role "user" in the session but mensaEmpresariosAdminAt set in the DB.
      try {
        const { status } = await checkCompaniesAdminAccess();
        if (!isMounted) return;

        if (status === 200) {
          setAccessState("allowed");
        } else {
          setDeniedReason("forbidden");
          setAccessState("denied");
        }
      } catch {
        if (!isMounted) return;
        setDeniedReason("forbidden");
        setAccessState("denied");
      }
    };

    void verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const reloadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setActionError(null);

    try {
      const [pendingResult, membersResult] = await Promise.allSettled([
        getCompaniesBadgeRequests("PENDING", signal),
        getCompaniesMembers(signal)
      ]);

      if (pendingResult.status === "fulfilled") setPendingRequests(pendingResult.value);
      if (membersResult.status === "fulfilled") setApprovedMembers(membersResult.value);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessState !== "allowed") return;

    const controller = new AbortController();
    const run = async () => { await reloadData(controller.signal); };
    void run();
    return () => controller.abort();
  }, [accessState, reloadData]);

  const onApproveRequest = async (requestId: string) => {
    setActionError(null);
    const result = await approveCompaniesBadgeRequest(requestId);
    if (!result.success) { setActionError(result.message || "No se pudo aprobar."); return; }
    await reloadData();
  };

  const onRejectRequest = async (requestId: string) => {
    setActionError(null);
    const result = await rejectCompaniesBadgeRequest(requestId);
    if (!result.success) { setActionError(result.message || "No se pudo rechazar."); return; }
    await reloadData();
  };

  const onRemoveMember = async (userId: string) => {
    setActionError(null);
    const result = await removeCompaniesMember(userId);
    if (!result.success) { setActionError(result.message || "No se pudo quitar el acceso."); return; }
    await reloadData();
  };

  if (accessState !== "allowed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {accessState === "loading" ? (
          <p className="text-sm text-[var(--text-secondary)]">Verificando permisos...</p>
        ) : deniedReason === "forbidden" ? (
          <>
            <p className="font-[family-name:var(--font-spectral)] text-2xl font-semibold text-[var(--text-primary)]">
              Acceso denegado
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
              Esta sección está reservada para administradores de Mensa Empresarios. Si creés que debería tener acceso, comunicate con el administrador de Mathesis.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-400)]"
            >
              Volver al inicio
            </button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <ModulePage
      title="Mensa Empresarios"
      subtitle="Dashboard del administrador de Mensa Empresarios. Revisa solicitudes y confirma acceso a la badge."
      subtitleClassName="mt-1 text-sm text-[var(--text-primary)]"
    >
      <AppCard className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-500)]">
              Acciones rápidas
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">Panel de revisión</h2>
          </div>
          <span className="inline-flex rounded-full border border-[var(--navy-700)] bg-[var(--navy-900)] px-3 py-1.5 text-sm font-semibold text-white">
            Pendientes: {pendingRequests.length} · Aprobados: {approvedMembers.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {companiesTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-xl border p-4 text-left transition ${
                activeTab === tab.value
                  ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--navy-900)]"
                  : "border-[var(--navy-700)] bg-[var(--navy-900)] text-white hover:border-[var(--brand-500)] hover:bg-[var(--navy-800)]"
              }`}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
              <div className={`mt-1 text-xs ${activeTab === tab.value ? "text-[var(--navy-800)]" : "text-white/80"}`}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </AppCard>

      {activeTab === "pending" ? (
        <AppCard className="p-5">
          <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
            Solicitudes pendientes
          </h2>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4 text-sm text-white">
                No hay solicitudes pendientes.
              </p>
            ) : (
              pendingRequests.map((request) => {
                return (
                  <div key={request.id} className="rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <Link
                        href={`/perfil?userId=${encodeURIComponent(request.userId)}`}
                        className="block text-left text-base font-semibold text-white transition hover:text-[var(--brand-500)]"
                      >
                        {request.user.firstName && request.user.lastName
                          ? `${request.user.firstName} ${request.user.lastName}`
                          : request.user.email}
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void onApproveRequest(request.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400"
                          aria-label="Aprobar solicitud"
                          title="Aprobar"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void onRejectRequest(request.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-500"
                          aria-label="Rechazar solicitud"
                          title="Rechazar"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-white/85">{request.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </AppCard>
      ) : null}

      {activeTab === "approved" ? (
        <AppCard className="p-5">
          <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
            Usuarios aprobados
          </h2>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
            ) : approvedMembers.length === 0 ? (
              <p className="rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4 text-sm text-white">
                Todavía no hay usuarios con badge de Mensa Empresarios.
              </p>
            ) : (
              approvedMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4">
                  <div>
                    <p className="font-semibold text-white">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.email}
                    </p>
                    <p className="text-sm text-white/85">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--brand-500)]/90 px-2.5 py-1 text-xs font-semibold text-[var(--navy-900)]">
                      Mensa Empresarios
                    </span>
                    <button
                      type="button"
                      onClick={() => void onRemoveMember(member.userId)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-500"
                      aria-label="Quitar acceso de Mensa Empresarios"
                      title="Quitar acceso"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path d="M10 6h8m-4-4v8" />
                        <path d="M8 3H4a1 1 0 00-1 1v16a1 1 0 001 1h4" />
                        <path d="M13 16l-4-4 4-4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {actionError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </AppCard>
      ) : null}
    </ModulePage>
  );
}
