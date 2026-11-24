import "@/lib/i18n";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AteneoTopic } from "@/lib/api/ateneo";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const api = vi.hoisted(() => ({ listAteneoFeedForView: vi.fn(), listAteneoGroups: vi.fn() }));
vi.mock("@/lib/api/ateneo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ateneo")>();
  return { ...actual, ...api };
});

import { AteneoFeedMiddle } from "./AteneoFeedMiddle";

function topic(id: string, title: string, viewerIsGroupMember: boolean): AteneoTopic {
  return {
    id,
    groupId: `g-${id}`,
    groupLabel: `Grupo ${id}`,
    author: { userId: "u1", firstName: "Ana", lastName: "Paz", profileImageUrl: null, initials: "AP" },
    timeLabel: "ahora",
    title,
    description: "Texto",
    tone: "LIBRE",
    reactions: 0,
    comments: 0,
    isRecommended: false,
    createdAt: "2026-11-23T12:00:00.000Z",
    updatedAt: "2026-11-23T12:00:00.000Z",
    currentUserReactionValue: null,
    attachments: [],
    viewerIsGroupMember,
  } as AteneoTopic;
}

describe("AteneoFeedMiddle", () => {
  it("flags topics from groups the user has not joined", async () => {
    api.listAteneoFeedForView.mockResolvedValue({
      success: true,
      message: "OK",
      data: { topics: [topic("a", "Tema de mi grupo", true), topic("b", "Tema para descubrir", false)] },
    });
    api.listAteneoGroups.mockResolvedValue({ success: true, message: "OK", data: { groups: [] } });

    render(<AteneoFeedMiddle />);

    const discoveryCard = (await screen.findByText("Tema para descubrir")).closest("article")!;
    expect(within(discoveryCard).getByText("Grupo sugerido")).toBeInTheDocument();
    const memberCard = screen.getByText("Tema de mi grupo").closest("article")!;
    expect(within(memberCard).queryByText("Grupo sugerido")).not.toBeInTheDocument();
  });
});
