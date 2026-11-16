import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AteneoComment, AteneoGroup, AteneoTopic } from "@/lib/api/ateneo";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/auth", () => ({ getSessionUserId: vi.fn(async () => "me") }));

const api = vi.hoisted(() => ({
  getAteneoGroup: vi.fn(),
  getAteneoTopic: vi.fn(),
  listAteneoTopicComments: vi.fn(),
  listAteneoGroupMembers: vi.fn(),
}));

vi.mock("@/lib/api/ateneo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ateneo")>();
  return { ...actual, ...api };
});

import { AteneoTopicDiscussion } from "./AteneoTopicDiscussion";

const POLL_MS = 15000;

const author = (userId: string, firstName: string) => ({ userId, firstName, lastName: "Test", profileImageUrl: null, initials: firstName[0] });

function comment(id: string, content: string, minute: number, parentCommentId: string | null = null): AteneoComment {
  return {
    id,
    topicId: "t1",
    author: author(`u-${id}`, `Autor${id}`),
    content,
    isDeletedPlaceholder: false,
    timeLabel: "ahora",
    createdAt: new Date(Date.UTC(2026, 10, 15, 12, minute)).toISOString(),
    parentCommentId,
    mentionUserId: null,
    reactions: 0,
    currentUserReactionValue: null,
  };
}

const group = { id: "g1", name: "Lógica", isAdmin: false, commentsMode: "free", createTopicsMode: "free" } as AteneoGroup;
const topic = {
  id: "t1",
  groupId: "g1",
  groupLabel: "Lógica",
  author: author("other", "Otra"),
  timeLabel: "hace 1 h",
  title: "¿Qué es una prueba?",
  description: "Descripción del tema",
  tone: "SERIO",
  reactions: 0,
  comments: 2,
  isRecommended: false,
  createdAt: "2026-11-15T11:00:00.000Z",
  updatedAt: "2026-11-15T11:00:00.000Z",
  currentUserReactionValue: null,
  attachments: [],
} as AteneoTopic;

const root = comment("c1", "Comentario raíz", 1);
const reply = comment("c2", "Respuesta existente", 2, "c1");

function commentsResponse(comments: AteneoComment[]) {
  return { success: true, message: "OK", data: { comments } };
}

async function renderLoaded() {
  render(<AteneoTopicDiscussion groupId="g1" topicId="t1" />);
  await screen.findByText("Comentario raíz");
}

async function tick() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(POLL_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Object.values(api).forEach((mock) => mock.mockReset());
  api.getAteneoGroup.mockResolvedValue({ success: true, message: "OK", data: { group, rules: [] } });
  api.getAteneoTopic.mockResolvedValue({ success: true, message: "OK", data: { topic } });
  api.listAteneoTopicComments.mockResolvedValue(commentsResponse([root, reply]));
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AteneoTopicDiscussion live comments", () => {
  it("does not insert polled comments until the user asks for them", async () => {
    await renderLoaded();
    api.listAteneoTopicComments.mockResolvedValue(
      commentsResponse([root, reply, comment("c3", "Respuesta nueva", 3, "c1"), comment("c4", "Hilo nuevo", 4)])
    );

    await tick();

    expect(await screen.findByRole("button", { name: "2 comentarios nuevos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver 1 respuesta nueva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver 1 comentario nuevo" })).toBeInTheDocument();
    expect(screen.queryByText("Respuesta nueva")).not.toBeInTheDocument();
    expect(screen.queryByText("Hilo nuevo")).not.toBeInTheDocument();
  });

  it("reveals only the thread's replies from the thread button", async () => {
    await renderLoaded();
    api.listAteneoTopicComments.mockResolvedValue(
      commentsResponse([root, reply, comment("c3", "Respuesta nueva", 3, "c1"), comment("c4", "Hilo nuevo", 4)])
    );
    await tick();

    fireEvent.click(await screen.findByRole("button", { name: "Ver 1 respuesta nueva" }));

    expect(await screen.findByText("Respuesta nueva")).toBeInTheDocument();
    expect(screen.queryByText("Hilo nuevo")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 comentario nuevo" })).toBeInTheDocument();
  });

  it("reveals everything from the header shortcut, in chronological order", async () => {
    await renderLoaded();
    api.listAteneoTopicComments.mockResolvedValue(
      commentsResponse([root, reply, comment("c4", "Hilo nuevo B", 5), comment("c3", "Hilo nuevo A", 3)])
    );
    await tick();

    fireEvent.click(await screen.findByRole("button", { name: "2 comentarios nuevos" }));

    const a = await screen.findByText("Hilo nuevo A");
    const b = screen.getByText("Hilo nuevo B");
    expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: /comentarios? nuevos?/ })).not.toBeInTheDocument();
  });

  it("refreshes visible comments in place and never drops one missing from a poll", async () => {
    await renderLoaded();
    // The poll response lacks c2 (e.g. it started before the user's own post) and edits c1.
    api.listAteneoTopicComments.mockResolvedValue(commentsResponse([{ ...root, content: "Comentario raíz (moderado)" }]));

    await tick();

    expect(await screen.findByText("Comentario raíz (moderado)")).toBeInTheDocument();
    expect(screen.getByText("Respuesta existente")).toBeInTheDocument();
  });

  it("skips polling while the tab is hidden and polls again when it becomes visible", async () => {
    await renderLoaded();
    const callsAfterLoad = api.listAteneoTopicComments.mock.calls.length;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });

    await tick();
    expect(api.listAteneoTopicComments).toHaveBeenCalledTimes(callsAfterLoad);

    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    api.listAteneoTopicComments.mockResolvedValue(commentsResponse([root, reply, comment("c5", "Llegó al volver", 6)]));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(api.listAteneoTopicComments).toHaveBeenCalledTimes(callsAfterLoad + 1));
    expect(await screen.findByRole("button", { name: "1 comentario nuevo" })).toBeInTheDocument();
  });

  it("keeps working after a failed poll", async () => {
    await renderLoaded();
    api.listAteneoTopicComments.mockRejectedValueOnce(new Error("network"));
    await tick();
    expect(screen.getByText("Comentario raíz")).toBeInTheDocument();

    api.listAteneoTopicComments.mockResolvedValue(commentsResponse([root, reply, comment("c6", "Después del error", 7)]));
    await tick();
    expect(await screen.findByRole("button", { name: "1 comentario nuevo" })).toBeInTheDocument();
  });
});
