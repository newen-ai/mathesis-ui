"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/AppCard";
import { getSessionAccessDecision, type SessionRole } from "@/lib/api/auth";
import { ModulePage } from "../_components/ModulePage";
import {
  approveWhitelistRequest,
  getWhitelistRequests,
  getWhitelistUsers,
  getWhitelistedEmails,
  type WhitelistRequestRow,
  type WhitelistUserRow,
  type WhitelistedEmailRow,
} from "@/lib/api/admin";

type AccessState = "loading" | "allowed" | "denied";
type ViewMode = "requests" | "pending-users" | "whitelisted-emails";

const viewButtons: Array<{ value: ViewMode; label: string; description: string }> = [
  {
    value: "requests",
    label: "Solicitudes",
    description: "Emails solicitando acceso",
  },
  {
    value: "pending-users",
    label: "Usuarios pendientes",
    description: "Registrados pero aun no whitelistados",
  },
  {
    value: "whitelisted-emails",
    label: "Emails aprobados",
    description: "Lista canonical de acceso",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [role, setRole] = useState<SessionRole | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("requests");
  const [requests, setRequests] = useState<WhitelistRequestRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<WhitelistUserRow[]>([]);
  const [whitelistedEmails, setWhitelistedEmails] = useState<WhitelistedEmailRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      const decision = await getSessionAccessDecision();
      if (!isMounted) return;

      if (decision.sessionState !== "authenticated") {
        setAccessState("denied");
        router.replace("/");
        return;
      }

      setRole(decision.role ?? null);

      if (decision.role !== "admin") {
        setAccessState("denied");
        router.replace("/");
        return;
      }

      setAccessState("allowed");
    };

    void verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const reloadData = async () => {
    setIsLoadingData(true);
    setLoadError(null);

    try {
      const [requestsResult, pendingUsersResult, emailsResult] = await Promise.allSettled([
        getWhitelistRequests(),
        getWhitelistUsers("non-whitelisted"),
        getWhitelistedEmails(),
      ]);

      if (requestsResult.status === "fulfilled") {
        setRequests(requestsResult.value);
      }

      if (pendingUsersResult.status === "fulfilled") {
        setPendingUsers(pendingUsersResult.value);
      }

      if (emailsResult.status === "fulfilled") {
        setWhitelistedEmails(emailsResult.value);
      }

      const firstError = [requestsResult, pendingUsersResult, emailsResult].find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (firstError) {
        setLoadError(
          firstError.reason instanceof Error
            ? firstError.reason.message
            : "No pudimos cargar una parte del dashboard."
        );
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (accessState !== "allowed") return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const [requestsResult, pendingUsersResult, emailsResult] = await Promise.allSettled([
          getWhitelistRequests(controller.signal),
          getWhitelistUsers("non-whitelisted", controller.signal),
          getWhitelistedEmails(controller.signal),
        ]);

        if (!isMounted || controller.signal.aborted) return;

        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value);
        }

        if (pendingUsersResult.status === "fulfilled") {
          setPendingUsers(pendingUsersResult.value);
        }

        if (emailsResult.status === "fulfilled") {
          setWhitelistedEmails(emailsResult.value);
        }

        const firstError = [requestsResult, pendingUsersResult, emailsResult].find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );

        if (firstError) {
          setLoadError(
            firstError.reason instanceof Error
              ? firstError.reason.message
              : "No pudimos cargar una parte del dashboard."
          );
        }
      } finally {
        if (!isMounted || controller.signal.aborted) return;
        setIsLoadingData(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [accessState]);

  const viewSummary = useMemo(() => {
    return {
      requests: requests.length,
      pendingUsers: pendingUsers.length,
      whitelistedEmails: whitelistedEmails.length,
    };
  }, [requests.length, pendingUsers.length, whitelistedEmails.length]);

  const onApprove = async (requestId: string) => {
    setActionMessage(null);
    const result = await approveWhitelistRequest(requestId);

    if (!result.success) {
      setActionMessage(result.message);
      return;
    }

    setActionMessage("Solicitud aprobada correctamente.");
    await reloadData();
  };

  if (accessState !== "allowed") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-slate-600">
        Verificando permisos...
      </div>
    );
  }

  return (
    <ModulePage
      title="Panel de administracion"
      subtitle={`Acceso de administrador${role ? ` · ${role}` : ""}. Gestiona la whitelist y revisa solicitudes.`}
    >
      <AppCard className="p-5">
        <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-slate-900">
          Accesos rapidos
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {viewButtons.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveView(item.value)}
              className={`rounded-xl border p-4 text-left transition ${
                activeView === item.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className={`mt-1 text-xs ${activeView === item.value ? "text-slate-200" : "text-slate-600"}`}>
                {item.description}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Solicitudes: {viewSummary.requests} · Pendientes: {viewSummary.pendingUsers} · Aprobados: {viewSummary.whitelistedEmails}
        </div>
        {loadError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {loadError}
          </div>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void reloadData()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            Recargar datos
          </button>
        </div>
      </AppCard>

      <AppCard className="p-5">
        <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-slate-900">
          {activeView === "requests"
            ? "Solicitudes de acceso"
            : activeView === "pending-users"
              ? "Usuarios pendientes"
              : "Emails aprobados"}
        </h2>
        {actionMessage ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}

        {isLoadingData ? (
          <p className="mt-4 text-sm text-slate-600">Cargando datos...</p>
        ) : null}

        {!isLoadingData && activeView === "requests" ? (
          <div className="mt-4 space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-600">No hay solicitudes pendientes.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{request.user.email}</div>
                      <div className="text-xs text-slate-600">Canonical: {request.canonicalEmail}</div>
                      {request.message ? <div className="mt-2 text-sm text-slate-700">{request.message}</div> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(request.id)}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {!isLoadingData && activeView === "pending-users" ? (
          <div className="mt-4 space-y-3">
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-slate-600">No hay usuarios pendientes.</p>
            ) : (
              pendingUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                  <div className="text-xs text-slate-600">Canonical: {user.canonicalEmail}</div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {!isLoadingData && activeView === "whitelisted-emails" ? (
          <div className="mt-4 space-y-3">
            {whitelistedEmails.length === 0 ? (
              <p className="text-sm text-slate-600">No hay emails aprobados todavía.</p>
            ) : (
              whitelistedEmails.map((email) => (
                <div key={email.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{email.canonicalEmail}</div>
                  <div className="text-xs text-slate-600">ID: {email.id}</div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </AppCard>
    </ModulePage>
  );
}
