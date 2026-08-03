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
