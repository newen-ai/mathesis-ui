import {
  apiRequest,
  ApiServiceResponse,
  parseDataResponse,
  parseServiceResponse,
} from "@/lib/api/client";

export type EmploymentHistoryOutput = {
  id: string;
  company: string;
  jobTitle: string;
  startYearMonth: string;
  endYearMonth: string | null;
};

export type ProfileOutput = {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
  employmentHistory: EmploymentHistoryOutput[];
};

export type SearchProfileOutput = {
  userId: string;
  firstName: string;
  lastName: string;
};

export class ProfileSourceEmptyError extends Error {
  constructor() {
    super("Profile source is empty");
    this.name = "ProfileSourceEmptyError";
  }
}

export class ProfileHttpError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Profile request failed: ${status}`);
    this.name = "ProfileHttpError";
    this.status = status;
  }
}

type ProfileMeResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    role: string;
    profile: ProfileOutput;
  };
};

type ProfileDataEnvelope = ProfileMeResponse["data"] | ProfileOutput;

type ProfileMutationResponse = ApiServiceResponse;

export async function getMyProfileIdentity(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await apiRequest("/profile/me", {
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await parseDataResponse<ProfileMeResponse["data"]>(
      response,
      "Invalid profile response"
    );

    return payload.data.id ?? null;
  } catch {
    return null;
  }
}

function extractProfileFromEnvelope(data: unknown): ProfileOutput {
  if (!data || typeof data !== "object") {
    throw new ProfileSourceEmptyError();
  }

  if ("profile" in data) {
    const profile = (data as { profile?: ProfileOutput | null }).profile;
    if (!profile) {
      throw new ProfileSourceEmptyError();
    }

    return profile;
  }

  return data as ProfileOutput;
}

export function isProfileSourceEmptyError(error: unknown) {
  return error instanceof ProfileSourceEmptyError;
}

export type EmploymentHistoryInput = {
  company: string;
  jobTitle: string;
  startYearMonth: string;
  endYearMonth?: string;
};

export type WorkExperienceOperation =
  | {
      action: "ADD";
      company: string;
      jobTitle: string;
      startYearMonth: string;
      endYearMonth?: string;
    }
  | {
      action: "EDIT";
      id: string;
      company?: string;
      jobTitle?: string;
      startYearMonth?: string;
      endYearMonth?: string;
    }
  | {
      action: "REMOVE";
      id: string;
    };

export type PatchWorkExperiencesInput = {
  operations: WorkExperienceOperation[];
};

export type SaveProfileInput = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  employmentHistory?: EmploymentHistoryInput[];
};

export async function searchProfiles(
  text: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string; data: SearchProfileOutput[] }> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return {
      success: true,
      message: "",
      data: [],
    };
  }

  try {
    const query = new URLSearchParams({ text: normalizedText });
    const response = await apiRequest(`/profile/search?${query.toString()}`, {
      signal,
    });

    const payload = await parseDataResponse<SearchProfileOutput[]>(
      response,
      "Invalid profile search response"
    );

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to profile search service",
      data: [],
    };
  }
}

export async function getMyProfile(signal?: AbortSignal): Promise<ProfileOutput> {
  const response = await apiRequest("/profile/me", {
    signal,
  });

  if (response.status === 404) {
    throw new ProfileSourceEmptyError();
  }

  if (!response.ok) {
    throw new ProfileHttpError(
      response.status,
      `Unable to fetch profile: ${response.status}`
    );
  }

  const payload = await parseDataResponse<ProfileDataEnvelope>(
    response,
    "Invalid profile response"
  );

  return extractProfileFromEnvelope(payload.data);
}

export async function getProfileByUserId(
  userId: string,
  signal?: AbortSignal
): Promise<ProfileOutput> {
  const response = await apiRequest(`/profile/${encodeURIComponent(userId)}`, {
    signal,
  });

  if (!response.ok) {
    throw new ProfileHttpError(
      response.status,
      `Unable to fetch profile by userId: ${response.status}`
    );
  }

  const payload = await parseDataResponse<ProfileDataEnvelope>(
    response,
    "Invalid profile response"
  );

  return extractProfileFromEnvelope(payload.data);
}

export async function saveMyProfile(
  input: SaveProfileInput
): Promise<ProfileMutationResponse> {
  try {
    const response = await apiRequest("/profile/me", {
      method: "POST",
      body: input,
    });

    return parseServiceResponse(
      response,
      `Invalid profile save response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to profile save service",
    };
  }
}

export async function patchWorkExperiences(
  input: PatchWorkExperiencesInput
): Promise<ProfileMutationResponse> {
  try {
    const response = await apiRequest("/profile/work-experiences", {
      method: "PATCH",
      body: input,
    });

    return parseServiceResponse(
      response,
      `Invalid work experiences response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to work experiences service",
    };
  }
}
