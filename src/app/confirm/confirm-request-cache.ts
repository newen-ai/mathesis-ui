import { verifyEmail } from "@/lib/api/auth";
import type { ApiServiceResponse } from "@/lib/api/client";

const confirmationRequestByToken = new Map<string, Promise<ApiServiceResponse>>();

export function verifyEmailOnce(token: string): Promise<ApiServiceResponse> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return Promise.resolve({
      success: false,
      message: "Verification token is required",
    });
  }

  const existingRequest = confirmationRequestByToken.get(normalizedToken);
  if (existingRequest) {
    return existingRequest;
  }

  const request = verifyEmail(normalizedToken);
  confirmationRequestByToken.set(normalizedToken, request);

  return request;
}

export function clearVerifyEmailOnceCache(): void {
  confirmationRequestByToken.clear();
}
