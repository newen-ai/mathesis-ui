import "@/lib/i18n";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImgHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router, useSearchParams: () => new URLSearchParams() }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const api = vi.hoisted(() => ({ listAteneoGroups: vi.fn(), getAteneoGroup: vi.fn(), createAteneoTopic: vi.fn() }));
vi.mock("@/lib/api/ateneo", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/api/ateneo")>()), ...api }));

import { AteneoNewTopicForm } from "./AteneoNewTopicForm";

function group(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return { id, name, createTopicsMode: "free", isAdmin: false, ...overrides };
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  Object.values(toast).forEach((mock) => mock.mockReset());
  router.push.mockReset();
  api.listAteneoGroups.mockResolvedValue({ success: true, message: "OK", data: { tab: "mine", groups: [group("g1", "Lógica")] } });
});

async function renderForm(groupId = "g1", groupName = "Lógica") {
  const user = userEvent.setup();
  render(<AteneoNewTopicForm groupId={groupId} />);
  await waitFor(() => expect(api.listAteneoGroups).toHaveBeenCalled());
  await screen.findAllByText(groupName);
  return user;
}

const publishButton = () => screen.getByRole("button", { name: "Publicar" });
const titleInput = () => screen.getByPlaceholderText(/título/i);
const descriptionInput = () => screen.getByRole("textbox", { name: /descripción/i });

describe("AteneoNewTopicForm validation on publish", () => {
  it("keeps Publicar enabled with an empty form and explains what is missing on click", async () => {
    const user = await renderForm();

    expect(publishButton()).toBeEnabled();
    await user.click(publishButton());

    expect(api.createAteneoTopic).not.toHaveBeenCalled();
    expect(screen.getByText("Escribí un título.")).toBeInTheDocument();
    expect(screen.getByText("Escribí una descripción.")).toBeInTheDocument();
    expect(titleInput()).toHaveAttribute("aria-invalid", "true");
    expect(titleInput()).toHaveFocus();
    // Field errors are inline only; no duplicate toast.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports a missing description only, focusing it (the reported case)", async () => {
    const user = await renderForm();

    await user.type(titleInput(), "Tema sin descripción");
    await user.click(publishButton());

    expect(screen.queryByText("Escribí un título.")).not.toBeInTheDocument();
    expect(screen.getByText("Escribí una descripción.")).toBeInTheDocument();
    expect(descriptionInput()).toHaveFocus();

    await user.type(descriptionInput(), "x");
    expect(screen.queryByText("Escribí una descripción.")).not.toBeInTheDocument();
  });

  it("applies the backend minimum length before sending", async () => {
    const user = await renderForm();

    await user.type(titleInput(), "ab");
    await user.type(descriptionInput(), "Descripción válida");
    await user.click(publishButton());

    expect(screen.getByText("El título necesita al menos 3 caracteres.")).toBeInTheDocument();
    expect(api.createAteneoTopic).not.toHaveBeenCalled();
  });

  it("publishes valid topics and goes to the new topic", async () => {
    api.createAteneoTopic.mockResolvedValue({ success: true, message: "OK", data: { topic: { id: "t9" } } });
    const user = await renderForm();

    await user.type(titleInput(), "  Tema válido  ");
    await user.type(descriptionInput(), "Una descripción suficiente");
    await user.click(publishButton());

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/ateneo/groups/g1/topics/t9"));
    expect(api.createAteneoTopic).toHaveBeenCalledWith("g1", expect.objectContaining({ title: "Tema válido", description: "Una descripción suficiente" }));
  });

  it("shows backend validation errors next to the right field", async () => {
    const backendError = Object.assign(new Error("Validation failed"), {
      status: 400,
      details: [{ code: "too_small", minimum: 10, path: ["body", "description"] }]
    });
    api.createAteneoTopic.mockRejectedValue(backendError);
    const user = await renderForm();

    await user.type(titleInput(), "Tema válido");
    await user.type(descriptionInput(), "Corta pero ok");
    await user.click(publishButton());

    expect(await screen.findByText("La descripción necesita al menos 10 caracteres.")).toBeInTheDocument();
    expect(descriptionInput()).toHaveAttribute("aria-invalid", "true");
    expect(toast.error).not.toHaveBeenCalled();
    expect(publishButton()).toBeEnabled();
  });

  it("falls back to the generic publish error for non-field failures", async () => {
    api.createAteneoTopic.mockRejectedValue(Object.assign(new Error("Too many attachments"), { status: 400, details: { code: "ATENEO_TOO_MANY_ATTACHMENTS" } }));
    const user = await renderForm();

    await user.type(titleInput(), "Tema válido");
    await user.type(descriptionInput(), "Descripción válida");
    await user.click(publishButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/hasta 5 archivos/)));
  });

  it("keeps Publicar visible in admins-only groups and explains why it cannot publish", async () => {
    api.listAteneoGroups.mockResolvedValue({
      success: true,
      message: "OK",
      data: { tab: "mine", groups: [group("g2", "Anuncios", { createTopicsMode: "admins" })] }
    });
    const user = await renderForm("g2", "Anuncios");

    await user.type(titleInput(), "Tema válido");
    await user.type(descriptionInput(), "Descripción válida");
    await user.click(publishButton());

    expect(screen.getByRole("alert")).toHaveTextContent("En este grupo solo los administradores pueden crear temas.");
    expect(api.createAteneoTopic).not.toHaveBeenCalled();
  });
});
