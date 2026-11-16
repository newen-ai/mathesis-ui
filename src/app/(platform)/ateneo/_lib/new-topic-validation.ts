/**
 * Client-side validation for the new topic form. Limits mirror the backend schema
 * (mathesis-backend src/modules/ateneo/ateneo.schemas.ts `createAteneoTopicSchema`), which stays the source of truth.
 */
export const TOPIC_TITLE_MIN_LENGTH = 3;
export const TOPIC_TITLE_MAX_LENGTH = 100;
export const TOPIC_DESCRIPTION_MIN_LENGTH = 3;
export const TOPIC_DESCRIPTION_MAX_LENGTH = 1000;

export type NewTopicField = "group" | "title" | "description";

export type NewTopicFieldError = {
  /** i18n key under `ateneo:newTopic.errors`. */
  key:
    | "groupRequired"
    | "groupAdminsOnly"
    | "titleRequired"
    | "titleTooShort"
    | "titleTooLong"
    | "descriptionRequired"
    | "descriptionTooShort"
    | "descriptionTooLong";
  params?: Record<string, number>;
};

export type NewTopicErrors = Partial<Record<NewTopicField, NewTopicFieldError>>;

export const NEW_TOPIC_FIELD_ORDER: NewTopicField[] = ["group", "title", "description"];

type NewTopicInput = {
  groupId: string;
  canCreateTopics: boolean;
  title: string;
  description: string;
};

/** Same normalization as the backend: CRLF -> LF, then trim. */
export function normalizeTopicText(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function validateText(
  value: string,
  field: "title" | "description",
  min: number,
  max: number
): NewTopicFieldError | undefined {
  const length = normalizeTopicText(value).length;

  if (length === 0) {
    return { key: `${field}Required` };
  }

  if (length < min) {
    return { key: `${field}TooShort`, params: { min } };
  }

  if (length > max) {
    return { key: `${field}TooLong`, params: { max } };
  }

  return undefined;
}

export function validateNewTopic(input: NewTopicInput): NewTopicErrors {
  const errors: NewTopicErrors = {};

  if (!input.groupId.trim()) {
    errors.group = { key: "groupRequired" };
  } else if (!input.canCreateTopics) {
    errors.group = { key: "groupAdminsOnly" };
  }

  const title = validateText(input.title, "title", TOPIC_TITLE_MIN_LENGTH, TOPIC_TITLE_MAX_LENGTH);
  if (title) errors.title = title;

  const description = validateText(input.description, "description", TOPIC_DESCRIPTION_MIN_LENGTH, TOPIC_DESCRIPTION_MAX_LENGTH);
  if (description) errors.description = description;

  return errors;
}

export function firstInvalidField(errors: NewTopicErrors): NewTopicField | undefined {
  return NEW_TOPIC_FIELD_ORDER.find((field) => errors[field]);
}

type ValidationIssue = {
  code?: unknown;
  path?: unknown;
  minimum?: unknown;
  maximum?: unknown;
};

/**
 * Maps backend validation issues (`details` of a 400 "Validation failed") to field errors,
 * so a rule the client missed still lands next to the right field.
 */
export function mapBackendTopicIssues(details: unknown): NewTopicErrors {
  if (!Array.isArray(details)) {
    return {};
  }

  const errors: NewTopicErrors = {};

  for (const raw of details) {
    if (!raw || typeof raw !== "object") continue;
    const issue = raw as ValidationIssue;
    if (!Array.isArray(issue.path) || issue.path[0] !== "body") continue;

    const field: unknown = issue.path[1];
    if ((field !== "title" && field !== "description") || errors[field]) continue;

    if (issue.code === "too_small") {
      const min = typeof issue.minimum === "number" ? issue.minimum : field === "title" ? TOPIC_TITLE_MIN_LENGTH : TOPIC_DESCRIPTION_MIN_LENGTH;
      errors[field] = { key: `${field}TooShort`, params: { min } };
    } else if (issue.code === "too_big") {
      const max = typeof issue.maximum === "number" ? issue.maximum : field === "title" ? TOPIC_TITLE_MAX_LENGTH : TOPIC_DESCRIPTION_MAX_LENGTH;
      errors[field] = { key: `${field}TooLong`, params: { max } };
    } else {
      errors[field] = { key: `${field}Required` };
    }
  }

  return errors;
}
