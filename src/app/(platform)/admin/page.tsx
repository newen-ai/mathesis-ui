"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  addCompaniesAdmin,
  getCompaniesAdmins,
  removeCompaniesAdmin,
  searchCompaniesEligibleAdmins,
  type CompaniesAdminRow,
  type CompaniesEligibleAdminRow
} from "@/lib/api/admin";

type AccessState = "loading" | "allowed" | "denied";
type ViewMode = "whitelist" | "mensa";
type WhitelistViewMode = "requests" | "pending-users" | "whitelisted-emails";

const dashboardTabs: Array<{ value: ViewMode; label: string; description: string }> = [
  {
    value: "whitelist",
    label: "Whitelist",
    description: "Mathesis access control",
  },
  {
    value: "mensa",
    label: "Mensa Empresarios",
    description: "Administradores y solicitudes",
  },
];

const whitelistViewButtons: Array<{ value: WhitelistViewMode; label: string; description: string }> = [
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
  const [activeTab, setActiveTab] = useState<ViewMode>("whitelist");
  const [activeWhitelistView, setActiveWhitelistView] = useState<WhitelistViewMode>("requests");
  const [requests, setRequests] = useState<WhitelistRequestRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<WhitelistUserRow[]>([]);
  const [whitelistedEmails, setWhitelistedEmails] = useState<WhitelistedEmailRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mensa admin state
  const [meAdmins, setMeAdmins] = useState<CompaniesAdminRow[]>([]);
  const [isLoadingMeAdmins, setIsLoadingMeAdmins] = useState(false);
  const [meAdminMessage, setMeAdminMessage] = useState<string | null>(null);
  const [meAdminError, setMeAdminError] = useState<string | null>(null);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [addAdminSearch, setAddAdminSearch] = useState("");
  const [eligibleAdmins, setEligibleAdmins] = useState<CompaniesEligibleAdminRow[]>([]);
  const [isSearchingAdmins, setIsSearchingAdmins] = useState(false);

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

  const reloadWhitelistData = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);

    try {
      const [requestsResult, pendingUsersResult, emailsResult] = await Promise.allSettled([
        getWhitelistRequests(),
        getWhitelistUsers("non-whitelisted"),
        getWhitelistedEmails(),
      ]);

      if (requestsResult.status === "fulfilled") setRequests(requestsResult.value);
      if (pendingUsersResult.status === "fulfilled") setPendingUsers(pendingUsersResult.value);
      if (emailsResult.status === "fulfilled") setWhitelistedEmails(emailsResult.value);

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
  }, []);

  const reloadMeAdmins = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingMeAdmins(true);
    setMeAdminError(null);

    try {
      const items = await getCompaniesAdmins(signal);
      setMeAdmins(items);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMeAdminError(error instanceof Error ? error.message : "No se pudieron cargar los administradores.");
    } finally {
      setIsLoadingMeAdmins(false);
    }
  }, []);

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

        if (requestsResult.status === "fulfilled") setRequests(requestsResult.value);
        if (pendingUsersResult.status === "fulfilled") setPendingUsers(pendingUsersResult.value);
        if (emailsResult.status === "fulfilled") setWhitelistedEmails(emailsResult.value);

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

  useEffect(() => {
    if (accessState !== "allowed" || activeTab !== "mensa") return;

    const controller = new AbortController();
    const run = async () => { await reloadMeAdmins(controller.signal); };
    void run();
    return () => controller.abort();
  }, [accessState, activeTab, reloadMeAdmins]);

  useEffect(() => {
    if (!isAddAdminModalOpen) return;

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setIsSearchingAdmins(true);
      try {
        const items = await searchCompaniesEligibleAdmins(addAdminSearch, controller.signal);
        if (!controller.signal.aborted) setEligibleAdmins(items);
      } catch {
        if (!controller.signal.aborted) setEligibleAdmins([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingAdmins(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addAdminSearch, isAddAdminModalOpen]);


  const viewSummary = useMemo(() => ({
    requests: requests.length,
    pendingUsers: pendingUsers.length,
    whitelistedEmails: whitelistedEmails.length,
  }), [requests.length, pendingUsers.length, whitelistedEmails.length]);

  const onApprove = async (requestId: string) => {
    setActionMessage(null);
    const result = await approveWhitelistRequest(requestId);

    if (!result.success) {
      setActionMessage(result.message);
      return;
    }

    setActionMessage("Solicitud aprobada correctamente.");
    await reloadWhitelistData();
  };

  const onOpenAddAdminModal = () => {
    setAddAdminSearch("");
    setEligibleAdmins([]);
    setIsAddAdminModalOpen(true);
  };

  const onAddAdmin = async (userId: string) => {
    setMeAdminMessage(null);
    setMeAdminError(null);
    const result = await addCompaniesAdmin(userId);

    if (!result.success) {
      setMeAdminError(result.message || "No se pudo agregar el administrador.");
      return;
    }

    setIsAddAdminModalOpen(false);
    setMeAdminMessage("Administrador agregado correctamente.");
    await reloadMeAdmins();
  };

  const onRemoveAdmin = async (userId: string) => {
    setMeAdminMessage(null);
    setMeAdminError(null);
    const result = await removeCompaniesAdmin(userId);

    if (!result.success) {
      setMeAdminError(result.message || "No se pudo quitar el administrador.");
      return;
    }

    setMeAdminMessage("Administrador quitado correctamente.");
    await reloadMeAdmins();
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
      subtitle={`Acceso de administrador${role ? ` · ${role}` : ""}. Gestiona la whitelist y el equipo de Mensa Empresarios.`}
      subtitleClassName="mt-1 text-sm text-[var(--text-primary)]"
    >
      <AppCard className="p-5">
        <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
          Accesos rapidos
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {dashboardTabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveTab(item.value)}
              className={`rounded-xl border p-4 text-left transition ${
                activeTab === item.value
                  ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--navy-900)]"
                  : "border-[var(--navy-700)] bg-[var(--navy-900)] text-white hover:border-[var(--brand-500)] hover:bg-[var(--navy-800)]"
              }`}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div
                className={`mt-1 text-xs ${
                  activeTab === item.value
                    ? "text-[var(--navy-800)]"
                    : "text-white/80"
                }`}
              >
                {item.description}
              </div>
            </button>
          ))}
        </div>

        {activeTab === "whitelist" ? (
          <div className="mt-4 text-xs text-[var(--text-secondary)]">
            Solicitudes: {viewSummary.requests} · Pendientes: {viewSummary.pendingUsers} · Aprobados: {viewSummary.whitelistedEmails}
          </div>
        ) : (
          <div className="mt-4 text-xs font-semibold text-[var(--text-primary)]">
            Administradores activos: {meAdmins.length}
          </div>
        )}

        {loadError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {loadError}
          </div>
        ) : null}

      </AppCard>

      {activeTab === "whitelist" ? (
        <AppCard className="p-5">
          <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
            {activeWhitelistView === "requests"
              ? "Solicitudes de acceso"
              : activeWhitelistView === "pending-users"
                ? "Usuarios pendientes"
                : "Emails aprobados"}
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {whitelistViewButtons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveWhitelistView(item.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  activeWhitelistView === item.value
                    ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--navy-900)]"
                    : "border-[var(--navy-700)] bg-[var(--navy-900)] text-white hover:border-[var(--brand-500)] hover:bg-[var(--navy-800)]"
                }`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div
                  className={`mt-1 text-xs ${
                    activeWhitelistView === item.value
                      ? "text-[var(--navy-800)]"
                      : "text-white/80"
                  }`}
                >
                  {item.description}
                </div>
              </button>
            ))}
          </div>

          {actionMessage ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {actionMessage}
            </div>
          ) : null}

          {isLoadingData ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Cargando datos...</p>
          ) : null}

          {!isLoadingData && activeWhitelistView === "requests" ? (
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

          {!isLoadingData && activeWhitelistView === "pending-users" ? (
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

          {!isLoadingData && activeWhitelistView === "whitelisted-emails" ? (
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
      ) : null}

      {activeTab === "mensa" ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
                Administradores de Mensa Empresarios
              </h2>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                El administrador principal de Mathesis puede habilitar o quitar permisos aquí.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddAdminModal}
              className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[color:color-mix(in_srgb,var(--brand-500)_85%,white)]"
            >
              Agregar admin
            </button>
          </div>

          {meAdminMessage ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {meAdminMessage}
            </div>
          ) : null}

          {meAdminError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {meAdminError}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {isLoadingMeAdmins ? (
              <p className="text-sm text-[var(--text-secondary)]">Cargando administradores...</p>
            ) : meAdmins.length === 0 ? (
              <p className="rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4 text-sm text-white">
                No hay administradores de Mensa Empresarios todavía.
              </p>
            ) : (
              meAdmins.map((admin) => (
                <div key={admin.userId} className="flex flex-col gap-3 rounded-2xl border border-[var(--navy-700)] bg-[var(--navy-900)] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {admin.firstName && admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.email}
                    </div>
                    <div className="text-xs text-white/80">{admin.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRemoveAdmin(admin.userId)}
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                  >
                    Quitar admin
                  </button>
                </div>
              ))
            )}
          </div>
        </AppCard>
      ) : null}

      {isAddAdminModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[var(--text-primary)]">
                Agregar administrador de Mensa Empresarios
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAdminModalOpen(false)}
                className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Buscá por nombre o email para habilitar un nuevo administrador.
            </p>

            <label className="sr-only" htmlFor="add-admin-search">Buscar usuario</label>
            <input
              id="add-admin-search"
              type="search"
              value={addAdminSearch}
              onChange={(event) => setAddAdminSearch(event.target.value)}
              placeholder="Buscar por nombre o email"
              className="mt-4 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)]"
            />

            <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
              {isSearchingAdmins ? (
                <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">Buscando...</p>
              ) : eligibleAdmins.length === 0 ? (
                <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  No encontramos usuarios disponibles para agregar.
                </p>
              ) : (
                eligibleAdmins.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onAddAdmin(user.userId)}
                      className="rounded-full bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--navy-900)] transition hover:bg-[color:color-mix(in_srgb,var(--brand-500)_85%,white)]"
                    >
                      Hacer admin
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ModulePage>
  );
}
