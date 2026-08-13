import {
  apiRequest,
  parseDataResponse,
  parseServiceResponse,
  type ApiServiceResponse,
} from "@/lib/api/client";

export type Enterprise = {
  id: string;
  name: string;
  role: string;
  website: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEnterpriseInput = {
  companyName: string;
  role: string;
  website?: string;
  description?: string;
};

export async function listMyEnterprises(signal?: AbortSignal): Promise<Enterprise[]> {
  const response = await apiRequest("/enterprises/my", {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch enterprises: ${response.status}`);
  }

  const payload = await parseDataResponse<{ enterprises: Enterprise[] }>(
    response,
    "Invalid enterprises list response"
  );

  return payload.data.enterprises;
}

export async function createEnterprise(
  input: CreateEnterpriseInput
): Promise<ApiServiceResponse> {
  const response = await apiRequest("/enterprises", {
    method: "POST",
    body: {
      companyName: input.companyName,
      role: input.role,
      website: input.website,
      description: input.description,
    },
  });

  if (!response.ok) {
    return parseServiceResponse(
      response,
      "Respuesta inválida del servicio de empresas."
    );
  }

  const payload = await parseDataResponse<{ enterprise: Enterprise }>(
    response,
    "Invalid enterprise create response"
  );

  return {
    success: payload.success,
    message: payload.message,
    status: response.status,
  };
}

export async function updateEnterprise(
  enterpriseId: string,
  input: CreateEnterpriseInput
): Promise<ApiServiceResponse> {
  const response = await apiRequest(`/enterprises/${enterpriseId}`, {
    method: "PATCH",
    body: {
      companyName: input.companyName,
      role: input.role,
      website: input.website,
      description: input.description,
    },
  });

  if (!response.ok) {
    return parseServiceResponse(
      response,
      "Respuesta inválida del servicio de empresas."
    );
  }

  const payload = await parseDataResponse<{ enterprise: Enterprise }>(
    response,
    "Invalid enterprise update response"
  );

  return {
    success: payload.success,
    message: payload.message,
    status: response.status,
  };
}

export async function deleteEnterprise(
  enterpriseId: string
): Promise<ApiServiceResponse> {
  const response = await apiRequest(`/enterprises/${enterpriseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return parseServiceResponse(
      response,
      "Respuesta inválida del servicio de empresas."
    );
  }

  const payload = await parseDataResponse<{ enterpriseId: string }>(
    response,
    "Invalid enterprise delete response"
  );

  return {
    success: payload.success,
    message: payload.message,
    status: response.status,
  };
}
