import "@/lib/i18n";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatDetail, ChatSummary } from "@/lib/api/chat";

vi.mock("../_components/ModulePage", () => ({ ModulePage: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/api/profile", () => ({ getMyProfileIdentity: vi.fn(async () => "me"), searchProfiles: vi.fn() }));

const LIST_DELAY_MS = 300;

const chatApi = vi.hoisted(() => ({
  listMyChats: vi.fn(),
  getChatById: vi.fn(),
  readChatMessages: vi.fn(),
  markChatAsRead: vi.fn(),
  createDirectChat: vi.fn(),
  createGroupChat: vi.fn(),
  sendChatMessage: vi.fn()
}));

vi.mock("@/lib/api/chat", () => chatApi);

import MensajesPage from "./page";

const people: Record<string, string> = { a: "Ana", b: "Bruno", c: "Carla" };

function summary(id: string): ChatSummary {
  return {
    id,
    type: "DIRECT",
    title: null,
    isAdmin: false,
    membersCount: 2,
    unreadMessagesCount: 0,
    lastMessageAt: null,
    lastMessagePreview: null
  };
}

function detail(id: string): ChatDetail {
  const member = (userId: string, firstName: string) => ({
    user: { userId, firstName, lastName: "Test", currentJobTitle: null, currentCompany: null },
    role: "MEMBER" as const,
    joinedAt: "2026-11-01T12:00:00.000Z"
  });
  return {
    id,
    type: "DIRECT",
    title: null,
    createdByUserId: "me",
    createdAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-01T12:00:00.000Z",
    isAdmin: false,
    isBlockedByCurrentUser: false,
    isBlockedByOtherUser: false,
    members: [member("me", "Yo"), member(`u-${id}`, people[id])]
  } as ChatDetail;
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function activeChatName() {
  const active = screen.getAllByRole("button").find((button) => button.className.includes("bg-[var(--brand-50)]"));
  return active?.textContent ?? "";
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {}
  }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.clearAllMocks();
  chatApi.listMyChats.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve({ data: { chats: ["a", "b", "c"].map(summary) } }), LIST_DELAY_MS))
  );
  chatApi.getChatById.mockImplementation(async (id: string) => ({ data: detail(id) }));
  chatApi.readChatMessages.mockResolvedValue({ data: { messages: [], nextCursor: null } });
  chatApi.markChatAsRead.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MensajesPage conversation switching", () => {
  it("keeps the last clicked chat when switching quickly, without reloading the list", async () => {
    render(<MensajesPage />);
    await advance(LIST_DELAY_MS + 50);
    await screen.findAllByText("Bruno Test");
    expect(chatApi.listMyChats).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByText("Bruno Test")[0].closest("button")!);
    fireEvent.click(screen.getAllByText("Carla Test")[0].closest("button")!);

    // Well past any in-flight list load, still before the 10 s polling tick.
    await advance(LIST_DELAY_MS * 5);

    expect(activeChatName()).toContain("Carla Test");
    // Selecting a chat must not re-run the page bootstrap (that loop caused the ping-pong).
    expect(chatApi.listMyChats).toHaveBeenCalledTimes(1);
  });
});

describe("MensajesPage history pagination", () => {
  function message(id: string, minute: number) {
    return {
      id,
      chatId: "a",
      senderUserId: "u-a",
      sender: { userId: "u-a", firstName: "Ana", lastName: "Test", currentJobTitle: null, currentCompany: null },
      content: `Mensaje ${id}`,
      isDeleted: false,
      editedAt: null,
      createdAt: `2026-11-01T12:${String(minute).padStart(2, "0")}:00.000Z`,
    };
  }

  it("requests the older page once even when scroll events fire in a burst at the top", async () => {
    let releaseOlderPage: (value: unknown) => void = () => {};
    chatApi.readChatMessages.mockImplementation(async (_chatId: string, options: { cursor?: string } = {}) => {
      if (options.cursor) {
        return new Promise((resolve) => {
          releaseOlderPage = resolve;
        });
      }
      // Newest first, like the backend; more history behind cursor "m1".
      return { data: { messages: [message("m3", 3), message("m2", 2), message("m1", 1)], nextCursor: "m1" } };
    });

    render(<MensajesPage />);
    await advance(LIST_DELAY_MS + 50);
    fireEvent.click((await screen.findAllByText("Ana Test"))[0].closest("button")!);
    await screen.findByText("Mensaje m3");
    // The page ignores scroll for 700 ms while it settles a newly opened conversation at the bottom.
    await advance(1000);

    const viewport = document.querySelector<HTMLElement>('[class*="overflow-anchor"]')!;
    expect(viewport).not.toBeNull();
    viewport.scrollTop = 0;
    for (let index = 0; index < 3; index += 1) {
      fireEvent.scroll(viewport);
    }

    const olderCalls = () =>
      chatApi.readChatMessages.mock.calls.filter(([, options]) => (options as { cursor?: string } | undefined)?.cursor);
    expect(olderCalls()).toHaveLength(1);
    expect(olderCalls()[0][1]).toMatchObject({ cursor: "m1" });

    await act(async () => {
      releaseOlderPage({ data: { messages: [message("m0", 0)], nextCursor: null } });
    });
    expect(await screen.findByText("Mensaje m0")).toBeInTheDocument();
  });
});
