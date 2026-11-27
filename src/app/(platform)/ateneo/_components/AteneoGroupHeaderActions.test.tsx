import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import { AteneoGroupHeaderActions } from "./AteneoGroupHeaderActions";

function renderActions(overrides: Partial<Parameters<typeof AteneoGroupHeaderActions>[0]> = {}) {
  const onLeave = vi.fn(async () => undefined);
  render(
    <AteneoGroupHeaderActions groupId="g1" groupName="Lógica" isAdmin={false} isOwner={false} onLeave={onLeave} {...overrides} />
  );
  return { onLeave: (overrides.onLeave as typeof onLeave | undefined) ?? onLeave };
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Más opciones del grupo" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AteneoGroupHeaderActions", () => {
  it("shows edit only to admins, inside the options menu", () => {
    renderActions();
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Editar grupo" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Salir del grupo" })).toBeEnabled();
  });

  it("lists edit for admins", () => {
    renderActions({ isAdmin: true });
    openMenu();
    expect(screen.getByRole("menuitem", { name: "Editar grupo" })).toHaveAttribute("href", "/ateneo/groups/g1/edit");
  });

  it("disables leaving for the owner and explains why", () => {
    const { onLeave } = renderActions({ isAdmin: true, isOwner: true });
    openMenu();
    const leave = screen.getByRole("menuitem", { name: "Salir del grupo" });
    expect(leave).toBeDisabled();
    expect(screen.getByText("Sos el creador del grupo, no podés salir.")).toBeInTheDocument();
    fireEvent.click(leave);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("asks for confirmation before leaving", async () => {
    const { onLeave } = renderActions();
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Salir del grupo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Vas a salir de Lógica.");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Salir del grupo" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Salir del grupo" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(onLeave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Saliste del grupo"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the dialog open and reports the error when leaving fails", async () => {
    const onLeave = vi.fn(async () => {
      throw new Error("boom");
    });
    renderActions({ onLeave });
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Salir del grupo" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Salir del grupo" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("No pudimos sacarte del grupo. Intentá de nuevo."));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
