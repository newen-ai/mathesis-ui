import { apiRequest, parseDataResponse, parseServiceResponse } from "@/lib/api/client";

export type WhitelistedEmailRow = {
  id: string;
  canonicalEmail: string;
  createdAt: string;
  createdByUserId: string | null;
};

export type WhitelistUserRow = {
  id: string;
  email: string;
  canonicalEmail: string;
  role: string;
  createdAt: string;
  isWhitelisted: boolean;
};

export type WhitelistRequestRow = {
  id: string;
  userId: string;
  canonicalEmail: string;
  message?: string | null;
  status: string;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user: {
    email: string;
  };
};

type ListEnvelope<T> = {
  success: boolean;
  message: string;
  data: {
    items: T[];
  };
};

async function fetchAdminList<T>(path: string, invalidMessage: string, signal?: AbortSignal): Promise<T[]> {
  const response = await apiRequest(path, { signal });

  if (!response.ok) {
    const serviceResponse = await parseServiceResponse(response, invalidMessage);
    throw new Error(serviceResponse.message || invalidMessage);
  }

  const payload = await parseDataResponse<ListEnvelope<T>["data"]>(response, invalidMessage);
  return payload.data.items;
}

export async function getWhitelistedEmails(signal?: AbortSignal): Promise<WhitelistedEmailRow[]> {
  return fetchAdminList<WhitelistedEmailRow>(
    "/admin/whitelist/emails",
    "Respuesta invalida de emails whitelistados",
    signal
  );
}

export async function getWhitelistUsers(
  status: "whitelisted" | "non-whitelisted",
  signal?: AbortSignal
): Promise<WhitelistUserRow[]> {
  const query = new URLSearchParams({ status });
  return fetchAdminList<WhitelistUserRow>(
    `/admin/whitelist/users?${query.toString()}`,
    "Respuesta invalida de usuarios de whitelist",
    signal
  );
}

export async function getWhitelistRequests(signal?: AbortSignal): Promise<WhitelistRequestRow[]> {
  const query = new URLSearchParams({ status: "PENDING" });
  return fetchAdminList<WhitelistRequestRow>(
    `/admin/whitelist/requests?${query.toString()}`,
    "Respuesta invalida de solicitudes de whitelist",
    signal
  );
}

export async function approveWhitelistRequest(requestId: string, reason?: string) {
  const response = await apiRequest(`/admin/whitelist/requests/${encodeURIComponent(requestId)}/approve`, {
    method: "POST",
    body: reason ? { reason } : {},
  });

  return parseServiceResponse(response, "Respuesta invalida al aprobar solicitud");
}

// ── Companies admin ───────────────────────────────────────────────────────────

/** Returns 200 for ME admin, 401 for unauthenticated, 403 for non-ME users. */
export async function checkCompaniesAdminAccess(signal?: AbortSignal): Promise<{ status: number }> {
  const response = await apiRequest("/admin/companies/access-check", { signal });
  return { status: response.status };
}

export type CompaniesMembershipState = {
  hasBadge: boolean;
  hasOpenRequest: boolean;
  openRequestId: string | null;
  openRequestCreatedAt: string | null;
};

export async function getCompaniesMembershipState(signal?: AbortSignal): Promise<CompaniesMembershipState> {
  const response = await apiRequest("/admin/companies/membership-state", { signal });

  if (!response.ok) {
    const serviceResponse = await parseServiceResponse(response, "Respuesta inválida del estado de membresía");
    throw new Error(serviceResponse.message || "No se pudo obtener el estado de membresía");
  }

  const payload = await parseDataResponse<CompaniesMembershipState>(
    response,
    "Respuesta inválida del estado de membresía"
  );

  return payload.data;
}

export async function createCompaniesMembershipRequest(message?: string) {
  const response = await apiRequest("/admin/companies/my-request", {
    method: "POST",
    body: message ? { message } : {}
  });

  return parseServiceResponse(response, "Respuesta inválida al crear solicitud de membresía");
}

export async function cancelCompaniesMembershipRequest() {
  const response = await apiRequest("/admin/companies/my-request", {
    method: "DELETE"
  });

  return parseServiceResponse(response, "Respuesta inválida al cancelar solicitud de membresía");
}


export type CompaniesBadgeRequestRow = {
  id: string;
  userId: string;
  badgeSlug: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type CompaniesMemberRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  grantedAt: string;
};

export type CompaniesAdminRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  adminSince: string | null;
};

export type CompaniesEligibleAdminRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export async function getCompaniesBadgeRequests(
  status: "PENDING" | "APPROVED" | "REJECTED" | "ALL" = "PENDING",
  signal?: AbortSignal
): Promise<CompaniesBadgeRequestRow[]> {
  return fetchAdminList<CompaniesBadgeRequestRow>(
    `/admin/companies/badge-requests?status=${encodeURIComponent(status)}`,
    "Respuesta inválida de solicitudes de badge",
    signal
  );
}

export async function approveCompaniesBadgeRequest(requestId: string) {
  const response = await apiRequest(`/admin/companies/badge-requests/${encodeURIComponent(requestId)}/approve`, {
    method: "POST"
  });

  return parseServiceResponse(response, "Respuesta inválida al aprobar solicitud de badge");
}

export async function rejectCompaniesBadgeRequest(requestId: string) {
  const response = await apiRequest(`/admin/companies/badge-requests/${encodeURIComponent(requestId)}/reject`, {
    method: "POST"
  });

  return parseServiceResponse(response, "Respuesta inválida al rechazar solicitud de badge");
}

export async function getCompaniesMembers(signal?: AbortSignal): Promise<CompaniesMemberRow[]> {
  return fetchAdminList<CompaniesMemberRow>(
    "/admin/companies/members",
    "Respuesta inválida de miembros",
    signal
  );
}

export async function removeCompaniesMember(userId: string) {
  const response = await apiRequest(`/admin/companies/members/${encodeURIComponent(userId)}`, {
    method: "DELETE"
  });

  return parseServiceResponse(response, "Respuesta inválida al quitar miembro");
}

export async function getCompaniesAdmins(signal?: AbortSignal): Promise<CompaniesAdminRow[]> {
  return fetchAdminList<CompaniesAdminRow>(
    "/admin/companies/admins",
    "Respuesta inválida de administradores",
    signal
  );
}

export async function searchCompaniesEligibleAdmins(
  query: string,
  signal?: AbortSignal
): Promise<CompaniesEligibleAdminRow[]> {
  return fetchAdminList<CompaniesEligibleAdminRow>(
    `/admin/companies/admins/search?q=${encodeURIComponent(query)}`,
    "Respuesta inválida en búsqueda de usuarios",
    signal
  );
}

export async function addCompaniesAdmin(userId: string) {
  const response = await apiRequest(`/admin/companies/admins/${encodeURIComponent(userId)}`, {
    method: "POST"
  });

  return parseServiceResponse(response, "Respuesta inválida al agregar administrador");
}

export async function removeCompaniesAdmin(userId: string) {
  const response = await apiRequest(`/admin/companies/admins/${encodeURIComponent(userId)}`, {
    method: "DELETE"
  });

  return parseServiceResponse(response, "Respuesta inválida al quitar administrador");
}
