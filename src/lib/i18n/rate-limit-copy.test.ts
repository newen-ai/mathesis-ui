import { describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";
import { getRateLimitMessage } from "./auth-errors";

describe("rate limit copy", () => {
  it("uses the real translations with singular and plural minutes", async () => {
    await i18n.changeLanguage("es");
    expect(getRateLimitMessage({ code: "RATE_LIMITED", retryAfterSeconds: 45 })).toBe("Demasiados intentos. Probá de nuevo en 1 minuto.");
    expect(getRateLimitMessage({ code: "RATE_LIMITED", retryAfterSeconds: 14 * 60 + 5 })).toBe(
      "Demasiados intentos. Probá de nuevo en 15 minutos."
    );
  });
});
