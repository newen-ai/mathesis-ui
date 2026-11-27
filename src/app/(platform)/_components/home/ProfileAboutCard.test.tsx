import "@/lib/i18n";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProfile } from "../../_lib/constants";
import type { Profile } from "../../_lib/types";
import { ProfileAboutCard } from "./ProfileAboutCard";
import { ProfileCollapsibleText, ProfileShowAllToggle } from "./ProfileCollapsibleText";
import { ProfileEditModal } from "./ProfileEditModal";

// jsdom has no layout: drive "overflow" through scrollHeight and a controllable ResizeObserver.
let overflowing = false;
beforeEach(() => {
  overflowing = false;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: () => void) {}
      observe() {
        this.callback();
      }
      disconnect() {}
    }
  );
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => (overflowing ? 200 : 40) });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 40 });
});

type HarnessProps = {
  initialProfile: Profile;
  onSave?: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  saveError?: string | null;
  isLoading?: boolean;
  canEdit?: boolean;
};

/** Mirrors ProfileView: the parent owns the loaded profile and which section is being edited. */
function Harness({ initialProfile, onSave, saveError = null, isLoading = false, canEdit = true }: HarnessProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setProfile((current) => ({ ...current, about: "Texto recargado del servidor" }))}>
        simular recarga
      </button>
      <ProfileAboutCard
        profile={profile}
        canEdit={canEdit}
        isEditingMode={isEditing}
        onStartEditing={() => setIsEditing(true)}
        onCloseEditing={() => setIsEditing(false)}
        isLoading={isLoading}
        isSaving={false}
        saveError={saveError}
        onClearSaveError={() => undefined}
        onSave={async (next) => {
          const result = (await onSave?.(next)) ?? { ok: true };
          if (result.ok) setProfile(next);
          return result;
        }}
      />
    </>
  );
}

const profile: Profile = { ...emptyProfile, nombre: "Ana", apellido: "Paz", about: "Me gusta la lógica." };

describe("ProfileAboutCard", () => {
  it("opens the editor seeded with the current about text (regression: it used to open empty)", async () => {
    const user = userEvent.setup();
    render(<Harness initialProfile={profile} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("textbox")).toHaveValue("Me gusta la lógica.");
    expect(within(dialog).getByText("19/800")).toBeInTheDocument();
  });

  it("re-seeds the draft from the latest profile every time it opens (regression: it showed stale data)", async () => {
    const user = userEvent.setup();
    render(<Harness initialProfile={profile} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.type(screen.getByRole("textbox"), " Borrador descartado");
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    await user.click(screen.getByRole("button", { name: "simular recarga" }));
    await user.click(screen.getByRole("button", { name: /editar/i }));

    expect(screen.getByRole("textbox")).toHaveValue("Texto recargado del servidor");
  });

  it("saves only the about text, keeping the rest of the profile", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => ({ ok: true }));
    render(<Harness initialProfile={profile} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    const textbox = screen.getByRole("textbox");
    await user.clear(textbox);
    await user.type(textbox, "Nuevo acerca de");
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(onSave).toHaveBeenCalledWith({ ...profile, about: "Nuevo acerca de" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Nuevo acerca de")).toBeInTheDocument();
  });

  it("keeps the modal open and shows the error when saving fails", async () => {
    const user = userEvent.setup();
    render(<Harness initialProfile={profile} onSave={async () => ({ ok: false, message: "Falló" })} saveError="Falló" />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Falló")).toBeInTheDocument();
  });

  it("shows the empty state, the loading state, and hides edit for other members", () => {
    const { rerender } = render(<Harness initialProfile={{ ...profile, about: "  " }} />);
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();

    rerender(<Harness initialProfile={profile} canEdit={false} key="readonly" />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();

    rerender(<Harness initialProfile={profile} isLoading key="loading" />);
    expect(screen.queryByText("Me gusta la lógica.")).not.toBeInTheDocument();
  });
});

describe("ProfileEditModal", () => {
  it("closes with Escape, the overlay and the close button, but not while busy", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <ProfileEditModal title="Editar" onClose={onClose}>
        <p>contenido</p>
      </ProfileEditModal>
    );

    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    await user.pointer({ keys: "[MouseLeft]", target: screen.getByRole("dialog").parentElement! });
    expect(onClose).toHaveBeenCalledTimes(3);

    // Clicks inside the dialog do not close it.
    await user.click(screen.getByText("contenido"));
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(
      <ProfileEditModal title="Editar" onClose={onClose} isBusy>
        <p>contenido</p>
      </ProfileEditModal>
    );
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[MouseLeft]", target: screen.getByRole("dialog").parentElement! });
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeDisabled();
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("ignores Escape already handled by an inner control and restores body scroll on unmount", async () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <ProfileEditModal title="Editar" onClose={onClose}>
        <input aria-label="buscar" onKeyDown={(event) => event.key === "Escape" && event.preventDefault()} />
      </ProfileEditModal>
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("buscar"));
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("ProfileCollapsibleText", () => {
  it("shows 'ver más' only when the text overflows, and toggles it", async () => {
    overflowing = true;
    const user = userEvent.setup();
    render(<ProfileCollapsibleText text={"Texto largo\n".repeat(20)} lines={2} />);

    const toggle = screen.getByRole("button", { name: /ver más/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: /ver menos/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders short text without a toggle and nothing for blank text", () => {
    const { container, rerender } = render(<ProfileCollapsibleText text="Corto" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<ProfileCollapsibleText text="   " />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ProfileShowAllToggle", () => {
  it("shows the hidden count and nothing when no item is hidden", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender, container } = render(<ProfileShowAllToggle hiddenCount={4} isShowingAll={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: /ver 4 más/i }));
    expect(onToggle).toHaveBeenCalled();

    rerender(<ProfileShowAllToggle hiddenCount={4} isShowingAll onToggle={onToggle} />);
    expect(screen.getByRole("button", { name: /ver menos/i })).toBeInTheDocument();

    rerender(<ProfileShowAllToggle hiddenCount={0} isShowingAll={false} onToggle={onToggle} />);
    expect(container).toBeEmptyDOMElement();
  });
});
