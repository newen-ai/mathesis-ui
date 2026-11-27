import i18next from "@/lib/i18n";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, okData } from "@/test/fetch-mock";
import { LegalDocumentPage } from "./LegalDocumentPage";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/terms", useRouter: () => ({ push: vi.fn() }) }));

afterEach(async () => {
  await i18next.changeLanguage("es");
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("LegalDocumentPage", () => {
  it("hydrates without mismatches when the browser starts in another language than the server", async () => {
    mockFetch(
      okData({ type: "TERMS", slug: "terms", version: "2026-11-27", title: "Términos", markdown: "# Términos\n\nTexto." })
    );
    // The server always renders Spanish.
    await i18next.changeLanguage("es");
    const html = renderToString(<LegalDocumentPage slug="terms" />);

    // The browser restored English from localStorage before hydrating.
    await i18next.changeLanguage("en");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, <LegalDocumentPage slug="terms" />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(/hydrat/i);
    // After hydration the page shows the localized copy and the document.
    expect(await vi.waitFor(() => container.querySelector("h1")?.textContent)).toBe("Términos");
    expect(container.textContent).toContain("Back");
  });
});
