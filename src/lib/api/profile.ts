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

type ProfileMutationResponse = ApiServiceResponse;

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

export async function getMyProfile(signal?: AbortSignal): Promise<ProfileOutput> {
  const response = await apiRequest("/profile/me", {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch profile: ${response.status}`);
  }

  const payload = await parseDataResponse<ProfileMeResponse["data"]>(
    response,
    "Invalid profile response"
  );

  return payload.data.profile;
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
