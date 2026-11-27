import { describe, expect, it } from "vitest";
import { parseLegalInline, parseLegalMarkdown } from "./legal-markdown";

describe("parseLegalMarkdown", () => {
  it("splits headings, paragraphs and lists", () => {
    const blocks = parseLegalMarkdown(
      "# Política\n\nSophium · Beta\n\n## 1. Datos\n\nPrimera línea\nsigue el párrafo.\n\n- **Al registrarte:** nombre.\n- Uso.\n\nCierre."
    );

    expect(blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "heading", "paragraph", "list", "paragraph"]);
    expect(blocks[0]).toEqual({ type: "heading", level: 1, content: [{ type: "text", text: "Política" }] });
    expect(blocks[3]).toEqual({ type: "paragraph", content: [{ type: "text", text: "Primera línea sigue el párrafo." }] });
    expect(blocks[4]).toEqual({
      type: "list",
      items: [
        [
          { type: "bold", text: "Al registrarte:" },
          { type: "text", text: " nombre." },
        ],
        [{ type: "text", text: "Uso." }],
      ],
    });
  });

  it("handles Windows line endings", () => {
    expect(parseLegalMarkdown("# A\r\n\r\nB\r\n")).toHaveLength(2);
  });
});

describe("parseLegalInline", () => {
  it("turns emails into mailto links and keeps the sentence's final dot outside", () => {
    expect(parseLegalInline("Escribinos a contact@sophium.social.")).toEqual([
      { type: "text", text: "Escribinos a " },
      { type: "link", text: "contact@sophium.social", href: "mailto:contact@sophium.social" },
      { type: "text", text: "." },
    ]);
  });

  it("keeps app, https and mailto links and shows any other link as text", () => {
    expect(parseLegalInline("[Política](/legal/privacy)")).toEqual([
      { type: "link", text: "Política", href: "/legal/privacy" },
    ]);
    expect(parseLegalInline("[Web](https://sophium.social)")[0]).toMatchObject({ type: "link" });
    expect(parseLegalInline("[x](javascript:alert(1))")[0]).toEqual({ type: "text", text: "x" });
    expect(parseLegalInline("[x](//evil.example)")).toEqual([{ type: "text", text: "x" }]);
  });
});
