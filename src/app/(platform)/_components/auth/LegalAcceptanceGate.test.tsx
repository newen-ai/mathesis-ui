import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, okData } from "@/test/fetch-mock";

import { LegalAcceptanceGate } from "./LegalAcceptanceGate";

const terms = okData({
  type: "TERMS",
  slug: "terms",
  version: "2026-11-27",
  title: "Términos y Condiciones de Uso",
  markdown: "# Términos y Condiciones de Uso\n\n## 1. Quiénes somos\n\nTexto de los términos.",
});
const privacy = okData({
  type: "PRIVACY",
  slug: "privacy",
  version: "2026-11-27",
  title: "Política de Privacidad",
  markdown: "# Política de Privacidad\n\nTexto de la política.",
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("LegalAcceptanceGate", () => {
  it("shows both texts, accepts only after the checkbox and sends the shown versions", async () => {
    const mock = mockFetch(terms, privacy, okData({ hasAcceptedCurrentLegalDocuments: true, pendingLegalDocuments: [] }));
    const onAccepted = vi.fn();
    render(<LegalAcceptanceGate onAccepted={onAccepted} />);

    expect(await screen.findByText("Términos y Condiciones de Uso")).toBeTruthy();
    expect(screen.getByText("Política de Privacidad")).toBeTruthy();
    expect(screen.getAllByText("Última actualización: 27 de noviembre de 2026")).toHaveLength(2);

    // Reading a text inline.
    fireEvent.click(screen.getAllByRole("button", { name: "Leer" })[0]);
    expect(screen.getByText("Texto de los términos.")).toBeTruthy();

    const accept = screen.getByRole("button", { name: "Aceptar y continuar" }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(accept.disabled).toBe(false);
    fireEvent.click(accept);

    await waitFor(() => expect(onAccepted).toHaveBeenCalledTimes(1));
    expect(mock.last.method).toBe("POST");
    expect(mock.last.path).toBe("/legal/acceptances");
    expect(mock.last.body).toEqual({ termsVersion: "2026-11-27", privacyVersion: "2026-11-27" });
  });

  it("reloads the texts and asks again when a newer version was published meanwhile", async () => {
    const mock = mockFetch(
      terms,
      privacy,
      { status: 400, body: { success: false, message: "Outdated", details: { code: "LEGAL_VERSION_OUTDATED" } } },
      terms,
      privacy
    );
    const onAccepted = vi.fn();
    render(<LegalAcceptanceGate onAccepted={onAccepted} />);

    await screen.findByText("Términos y Condiciones de Uso");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar y continuar" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() => expect(mock.requests).toHaveLength(5));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
