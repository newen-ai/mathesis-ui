export type EmploymentHistoryOutput = {
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function getMyProfile(signal?: AbortSignal): Promise<ProfileOutput> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: "GET",
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch profile: ${response.status}`);
  }

  const payload = (await response.json()) as ProfileMeResponse;

  if (!payload?.success || !payload.data) {
    throw new Error("Invalid profile response");
  }

  return payload.data.profile;
}
