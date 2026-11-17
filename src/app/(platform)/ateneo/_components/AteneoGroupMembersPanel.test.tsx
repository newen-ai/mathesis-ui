import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AteneoGroup, AteneoGroupMember } from "@/lib/api/ateneo";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/api/auth", () => ({ getSessionUserId: vi.fn(async () => "owner") }));

const api = vi.hoisted(() => ({
  getAteneoGroup: vi.fn(),
  listAteneoGroupMembers: vi.fn(),
  listAteneoGroupExpulsions: vi.fn(),
  listAteneoRemovedContent: vi.fn()
}));

vi.mock("@/lib/api/ateneo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ateneo")>();
  return { ...actual, ...api };
});

import { AteneoGroupMembersPanel } from "./AteneoGroupMembersPanel";

function member(userId: string, firstName: string): AteneoGroupMember {
  return {
    userId,
    firstName,
    lastName: "Test",
    profileImageUrl: null,
    initials: firstName[0],
    isAdmin: false,
    isOwner: false,
    isPinned: false,
    joinedAt: "2026-11-01T12:00:00.000Z"
  } as AteneoGroupMember;
}

function groupResponse(overrides: Partial<AteneoGroup>) {
  const group = { id: "g1", name: "Lógica", isMember: true, isAdmin: false, isOwner: false, memberCount: 3, ...overrides } as AteneoGroup;
  return { data: { group, rules: [] } };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listAteneoGroupMembers.mockImplementation(async (_groupId: string, options: { cursor?: string } = {}) =>
    options.cursor
      ? { data: { members: [member("u3", "Tercera")], nextCursor: null } }
      : { data: { members: [member("u1", "Primera"), member("u2", "Segunda")], nextCursor: "u2" } }
  );
  api.listAteneoGroupExpulsions.mockResolvedValue({ data: { expulsions: [] } });
  api.listAteneoRemovedContent.mockResolvedValue({
    data: { topics: [{ topicId: "t1", title: "Tema borrado", deletedAt: "2026-11-02T12:00:00.000Z", author: { firstName: "Ana", lastName: "Test" } }], comments: [] }
  });
});

describe("AteneoGroupMembersPanel", () => {
  it("pages members with a load-more button", async () => {
    api.getAteneoGroup.mockResolvedValue(groupResponse({}));
    render(<AteneoGroupMembersPanel groupId="g1" />);

    await screen.findByText("Primera Test");
    expect(api.listAteneoGroupMembers).toHaveBeenCalledWith("g1", { limit: 20 });
    expect(screen.queryByRole("tablist")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ver más miembros" }));
    await screen.findByText("Tercera Test");
    expect(api.listAteneoGroupMembers).toHaveBeenLastCalledWith("g1", { limit: 20, cursor: "u2" });
    expect(screen.queryByRole("button", { name: "Ver más miembros" })).toBeNull();
    expect(screen.getByText("3 miembros en total.")).toBeTruthy();
  });

  it("gives admins a moderation tab with the pending count", async () => {
    api.getAteneoGroup.mockResolvedValue(groupResponse({ isAdmin: true, isOwner: true }));
    render(<AteneoGroupMembersPanel groupId="g1" />);

    await screen.findByText("Primera Test");
    const moderationTab = screen.getByRole("tab", { name: /Moderación/ });
    expect(moderationTab.textContent).toContain("1");
    expect(screen.queryByText("Tema borrado")).toBeNull();

    fireEvent.click(moderationTab);
    fireEvent.click(screen.getByRole("button", { name: "Temas (1)" }));
    await waitFor(() => expect(screen.getByText("Tema borrado")).toBeTruthy());
    expect(screen.queryByText("Primera Test")).toBeNull();
  });
});
