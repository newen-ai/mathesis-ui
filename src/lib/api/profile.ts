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
  description: string | null;
  startYearMonth: string;
  endYearMonth: string | null;
};

export type EducationHistoryOutput = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYearMonth: string;
  endYearMonth: string | null;
  description: string | null;
};

export type BadgeOutput = {
  slug: string;
};

export type ProfileOutput = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
  about: string | null;
  locationCountry: string | null;
  locationCity: string | null;
  locationPostalCode: string | null;
  interests: string[];
  profileImageUrl: string | null;
  profileBannerImageUrl: string | null;
  badges: BadgeOutput[];
  employmentHistory: EmploymentHistoryOutput[];
  educationHistory: EducationHistoryOutput[];
};

export type InterestSuggestionOutput = {
  value: string;
};

export type SearchProfileOutput = {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
};

export class ProfileSourceEmptyError extends Error {
  constructor() {
    super("Profile source is empty");
    this.name = "ProfileSourceEmptyError";
  }
}

export type ContactMessageCategory =
  | "GENERAL_INQUIRY"
  | "TECHNICAL_ISSUE"
  | "SUGGESTION"
  | "BUG_REPORT"
  | "OTHER";

export type BugReportSubmitInput = {
  title: string;
  description: string;
  pageUrl: string;
  screenshots: File[];
};

export type BugReportAttachmentSummary = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type BugReportSummary = {
  id: string;
  title: string;
  description: string;
  pageUrl: string;
  createdAt: string;
  attachments: BugReportAttachmentSummary[];
};

export class ProfileHttpError extends Error {
  status: number;
  details?: {
    code?: string;
    redirectTo?: string;
  };

  constructor(
    status: number,
    message?: string,
    details?: {
      code?: string;
      redirectTo?: string;
    }
  ) {
    super(message ?? `Profile request failed: ${status}`);
    this.name = "ProfileHttpError";
    this.status = status;
    this.details = details;
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
  description?: string;
  startYearMonth: string;
  endYearMonth?: string;
};

export type WorkExperienceOperation =
  | {
      action: "ADD";
      company: string;
      jobTitle: string;
      description?: string;
      startYearMonth: string;
      endYearMonth?: string;
    }
  | {
      action: "EDIT";
      id: string;
      company?: string;
      jobTitle?: string;
      description?: string;
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

export type EducationHistoryInput = {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYearMonth: string;
  endYearMonth?: string;
  description?: string;
};

export type EducationOperation =
  | {
      action: "ADD";
      institution: string;
      degree: string;
      fieldOfStudy?: string;
      startYearMonth: string;
      endYearMonth?: string;
      description?: string;
    }
  | {
      action: "EDIT";
      id: string;
      institution?: string;
      degree?: string;
      fieldOfStudy?: string;
      startYearMonth?: string;
      endYearMonth?: string;
      description?: string;
    }
  | {
      action: "REMOVE";
      id: string;
    };

export type PatchEducationHistoryInput = {
  operations: EducationOperation[];
};

export type SaveProfileInput = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  about?: string;
  locationCountry?: string;
  locationCity?: string;
  locationPostalCode?: string;
  interests?: string[];
  profileImageUrl?: string;
  profileBannerImageUrl?: string;
  employmentHistory?: EmploymentHistoryInput[];
  educationHistory?: EducationHistoryInput[];
};

export async function searchInterestSuggestions(
  text: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string; data: InterestSuggestionOutput[] }> {
  const normalizedText = text.trim();

  if (normalizedText.length < 3) {
    return {
      success: true,
      message: "",
      data: [],
    };
  }

  try {
    const query = new URLSearchParams({ text: normalizedText });
    const response = await apiRequest(`/profile/interests/suggestions?${query.toString()}`, {
      signal,
    });

    const payload = await parseDataResponse<InterestSuggestionOutput[]>(
      response,
      "Invalid interests suggestions response"
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
          : "Could not connect to interests suggestion service",
      data: [],
    };
  }
}

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
    let details: { code?: string; redirectTo?: string } | undefined;

    try {
      const payload = (await response.json()) as {
        details?: {
          code?: string;
          redirectTo?: string;
        };
      };

      details = payload.details;
    } catch {
      details = undefined;
    }

    throw new ProfileHttpError(
      response.status,
      `Unable to fetch profile: ${response.status}`,
      details
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
    let details: { code?: string; redirectTo?: string } | undefined;

    try {
      const payload = (await response.json()) as {
        details?: {
          code?: string;
          redirectTo?: string;
        };
      };

      details = payload.details;
    } catch {
      details = undefined;
    }

    throw new ProfileHttpError(
      response.status,
      `Unable to fetch profile by userId: ${response.status}`,
      details
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

export async function patchEducationHistory(
  input: PatchEducationHistoryInput
): Promise<ProfileMutationResponse> {
  try {
    const response = await apiRequest("/profile/education-history", {
      method: "PATCH",
      body: input,
    });

    return parseServiceResponse(
      response,
      `Invalid education history response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to education history service",
    };
  }
}

export async function sendContactMessage(
  category: ContactMessageCategory,
  details: string
): Promise<ProfileMutationResponse> {
  try {
    const response = await apiRequest("/support/contact", {
      method: "POST",
      body: { category, details },
    });

    return parseServiceResponse(
      response,
      `Invalid contact message response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to support service",
    };
  }
}

export async function submitBugReport(
  input: BugReportSubmitInput
): Promise<ProfileMutationResponse> {
  try {
    const formData = new FormData();
    formData.set("title", input.title);
    formData.set("description", input.description);
    formData.set("pageUrl", input.pageUrl);

    for (const screenshot of input.screenshots) {
      formData.append("screenshots", screenshot);
    }

    const response = await apiRequest("/support/bug-reports", {
      method: "POST",
      body: formData,
    });

    return parseServiceResponse(
      response,
      `Invalid bug report response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to bug report service",
    };
  }
}

export async function listMyBugReports(signal?: AbortSignal): Promise<BugReportSummary[]> {
  const response = await apiRequest("/support/bug-reports/mine", {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Could not list bug reports: ${response.status}`);
  }

  const payload = await parseDataResponse<{ bugReports: BugReportSummary[] }>(
    response,
    "Invalid bug reports response"
  );

  return payload.data.bugReports;
}

export async function downloadBugReportAttachment(
  bugReportId: string,
  attachmentId: string,
  signal?: AbortSignal
): Promise<{ blob: Blob; fileName: string | null; mimeType: string }> {
  const response = await apiRequest(
    `/support/bug-reports/${encodeURIComponent(bugReportId)}/attachments/${encodeURIComponent(attachmentId)}`,
    {
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Could not download bug report attachment: ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const fileNameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const rawFileName = fileNameMatch?.[1] ?? fileNameMatch?.[2] ?? null;

  return {
    blob,
    fileName: rawFileName ? decodeURIComponent(rawFileName) : null,
    mimeType: response.headers.get("content-type") ?? blob.type,
  };
}

export async function getMyPreferences(): Promise<{ themePreference: string } | null> {
  try {
    const response = await apiRequest("/profile/me/preferences");

    if (!response.ok) {
      return null;
    }

    const payload = await parseDataResponse<{ themePreference: string }>(
      response,
      "Invalid preferences response"
    );

    return payload.data;
  } catch {
    return null;
  }
}

export async function updateMyPreferences(themePreference: string): Promise<ProfileMutationResponse> {
  try {
    const response = await apiRequest("/profile/me/preferences", {
      method: "PATCH",
      body: { themePreference },
    });

    return parseServiceResponse(
      response,
      `Invalid preferences response (${response.status})`
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
          ? "NEXT_PUBLIC_API_BASE_URL is not configured"
          : "Could not connect to profile service",
    };
  }
}
