import { describe, expect, it } from "vitest";
import { firstInvalidField, mapBackendTopicIssues, normalizeTopicText, validateNewTopic } from "./new-topic-validation";

const valid = { groupId: "g1", canCreateTopics: true, title: "Un título", description: "Una descripción" };

describe("validateNewTopic", () => {
  it("accepts a complete topic", () => {
    expect(validateNewTopic(valid)).toEqual({});
  });

  it("requires a group the user can post in", () => {
    expect(validateNewTopic({ ...valid, groupId: "  " }).group).toEqual({ key: "groupRequired" });
    expect(validateNewTopic({ ...valid, canCreateTopics: false }).group).toEqual({ key: "groupAdminsOnly" });
  });

  it("mirrors the backend length rules after trimming", () => {
    expect(validateNewTopic({ ...valid, description: "   " }).description).toEqual({ key: "descriptionRequired" });
    expect(validateNewTopic({ ...valid, description: " ab " }).description).toEqual({ key: "descriptionTooShort", params: { min: 3 } });
    expect(validateNewTopic({ ...valid, description: "x".repeat(1001) }).description).toEqual({ key: "descriptionTooLong", params: { max: 1000 } });
    expect(validateNewTopic({ ...valid, title: "" }).title).toEqual({ key: "titleRequired" });
    expect(validateNewTopic({ ...valid, title: "ab" }).title).toEqual({ key: "titleTooShort", params: { min: 3 } });
    expect(validateNewTopic({ ...valid, title: "x".repeat(101) }).title).toEqual({ key: "titleTooLong", params: { max: 100 } });
  });

  it("counts CRLF as one character, like the backend", () => {
    expect(normalizeTopicText(" a\r\nb ")).toBe("a\nb");
    expect(validateNewTopic({ ...valid, description: `${"x".repeat(499)}\r\n${"x".repeat(500)}` }).description).toBeUndefined();
  });

  it("orders errors by field position in the form", () => {
    const errors = validateNewTopic({ groupId: "", canCreateTopics: true, title: "", description: "" });
    expect(firstInvalidField(errors)).toBe("group");
    expect(firstInvalidField({ description: { key: "descriptionRequired" }, title: { key: "titleRequired" } })).toBe("title");
    expect(firstInvalidField({})).toBeUndefined();
  });
});

describe("mapBackendTopicIssues", () => {
  it("maps zod issues from the backend to field errors", () => {
    expect(
      mapBackendTopicIssues([
        { code: "too_small", minimum: 3, path: ["body", "title"] },
        { code: "too_big", maximum: 1000, path: ["body", "description"] },
        { code: "too_big", maximum: 999, path: ["body", "description"] }
      ])
    ).toEqual({
      title: { key: "titleTooShort", params: { min: 3 } },
      description: { key: "descriptionTooLong", params: { max: 1000 } }
    });
  });

  it("treats other issue codes as missing and falls back to known limits", () => {
    expect(mapBackendTopicIssues([{ code: "invalid_type", path: ["body", "description"] }])).toEqual({
      description: { key: "descriptionRequired" }
    });
    expect(mapBackendTopicIssues([{ code: "too_small", path: ["body", "description"] }, { code: "too_big", path: ["body", "title"] }])).toEqual({
      description: { key: "descriptionTooShort", params: { min: 3 } },
      title: { key: "titleTooLong", params: { max: 100 } }
    });
  });

  it("ignores anything that is not a topic field issue", () => {
    expect(mapBackendTopicIssues(undefined)).toEqual({});
    expect(mapBackendTopicIssues({ code: "ATENEO_TOO_MANY_ATTACHMENTS" })).toEqual({});
    expect(mapBackendTopicIssues([null, "x", { path: ["params", "groupId"] }, { path: ["body", "tone"], code: "invalid_enum_value" }, { path: "body" }])).toEqual({});
  });
});
