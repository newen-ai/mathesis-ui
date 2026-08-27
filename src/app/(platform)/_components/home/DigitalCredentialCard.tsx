"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { useProfessionalProfile } from "../../_lib/hooks/useProfessionalProfile";

const CREDENTIAL_TTL_MS = 5 * 60 * 1000;

type BadgePreview = {
  label: string;
  active: boolean;
};

type CardView = "front" | "back" | "qr";

export function DigitalCredentialCard() {
  const { badges, userDisplayName } = useProfessionalProfile();
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardView, setCardView] = useState<CardView>("front");
  const [verificationToken, setVerificationToken] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchVerificationToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/profile/me/credential/verification-token`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: { token?: string };
        };

        if (isMounted && payload.data?.token) {
          setVerificationToken(payload.data.token);
        }
      } catch {
        // Ignore token fetch failures and keep the card usable without a token.
      }
    };

    fetchVerificationToken();

    const refreshInterval = window.setInterval(() => {
      fetchVerificationToken();
    }, CREDENTIAL_TTL_MS / 2);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const badgePreviews = useMemo<BadgePreview[]>(() => {
    const fallbackItems = [
      "miembro_verificado",
      "fundadora_2026",
      "racha_activa",
    ];

    const items = badges.length > 0 ? badges.slice(0, 3) : fallbackItems;

    return items.map((badgeSlug) => {
      const normalized = String(badgeSlug).replace(/_/g, " ").trim();
      const label = normalized
        ? normalized.replace(/\b\w/g, (char) => char.toUpperCase())
        : "Miembro verificado";

      return {
        label,
        active: !String(badgeSlug).toLowerCase().includes("racha") && !String(badgeSlug).toLowerCase().includes("inactive"),
      };
    });
  }, [badges]);

  const fullName = userDisplayName || "María López";

  const flipTo = (nextView: CardView) => {
    if (cardView === nextView) {
      return;
    }

    if (nextView === "front") {
      setIsFlipped(false);
      setCardView("front");
      return;
    }

    if (cardView === "front") {
      setIsFlipped(true);
      window.setTimeout(() => {
        setCardView(nextView);
      }, 180);
      return;
    }

    setIsFlipped(false);
    window.setTimeout(() => {
      setCardView(nextView);
      setIsFlipped(true);
    }, 180);
  };

  const handlingBackView = cardView === "back" || cardView === "qr";

  const verificationUrl = useMemo(() => {
    if (!verificationToken) {
      return "";
    }

    const appBaseUrl =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const resolvedBaseUrl = appBaseUrl.replace(/\/$/, "");
    const verificationPath = new URL("/verificar", resolvedBaseUrl).toString();

    return `${verificationPath}?token=${encodeURIComponent(verificationToken)}`;
  }, [fullName, verificationToken]);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        <div
          className="relative w-full rounded-[1.7rem] shadow-[0_16px_36px_rgba(15,30,44,0.14)]"
          style={{ aspectRatio: "1.618 / 1", perspective: "1400px" }}
        >
          <div
            className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-[rgba(255,255,255,0.12)] bg-[var(--navy-800)] text-[var(--text-primary)] [backface-visibility:hidden]">
              <div className="flex h-full flex-col p-6">
                <div className="flex items-center gap-3 text-[var(--brand-100)]">
                  <span className="font-[family-name:var(--font-spectral)] text-[1.7rem] leading-none text-[#d4af66]">∫</span>
                  <span className="font-[family-name:var(--font-spectral)] text-[1.05rem] font-medium text-white">
                    Mathesis
                  </span>
                </div>

                <div className="mt-6 flex-1">
                  <h1 className="font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-[1.08] text-white">
                    {fullName}
                  </h1>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.12)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-500)] text-[0.5rem] font-black text-[var(--navy-900)]">
                      M
                    </span>
                    Miembro de Mensa Argentina
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="space-y-1 text-[0.7rem] text-white/90">
                    <div className="text-[0.72rem] font-medium text-white">Socio desde jul 2026</div>
                  </div>

                  <div className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[var(--brand-200)]">
                    Credencial activa
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-[rgba(255,255,255,0.12)] bg-[var(--navy-800)] text-[var(--text-primary)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {cardView === "qr" ? (
                <div className="flex h-full items-center justify-center p-5">
                  <div className="flex w-full max-w-[220px] items-center justify-center rounded-[1.4rem] bg-white p-3 shadow-[0_10px_20px_rgba(15,30,44,0.2)]">
                    {verificationUrl ? (
                      <QRCode
                        value={verificationUrl}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0f273f"
                        level="M"
                        aria-label="Código QR de verificación de credencial"
                      />
                    ) : (
                      <div className="flex h-[180px] w-[180px] items-center justify-center text-[0.7rem] font-medium text-[var(--navy-700)]">
                        Generando QR...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-2 pb-1 text-[var(--brand-200)]">
                    <span className="font-[family-name:var(--font-spectral)] text-[1.6rem] leading-none text-[var(--brand-500)]">∫</span>
                    <span className="font-[family-name:var(--font-spectral)] text-[1.1rem] font-medium text-white">
                      Mathesis · Insignias
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badgePreviews.map((badge) => (
                      <div
                        key={badge.label}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left ${
                          badge.active
                            ? "border-[#d4af66] bg-[#12243d] text-white shadow-[inset_0_0_0_1px_rgba(212,175,102,0.18)]"
                            : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] opacity-75"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.52rem] font-black ${
                            badge.active ? "bg-[#d4af66] text-[#102033]" : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                          }`}
                        >
                          ∫
                        </span>
                        <span className="text-[0.56rem] font-semibold uppercase tracking-[0.08em] leading-none">
                          {badge.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => flipTo(cardView === "back" ? "front" : "back")}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,39,63,0.12)] bg-[var(--surface-card)] px-4 py-2 text-[0.92rem] font-medium text-[var(--text-primary)] transition hover:border-[#d4af66] hover:bg-[var(--navy-800)] hover:text-white"
          >
            <span className="text-base">{cardView === "back" ? "↩" : "↪"}</span>
            {cardView === "back" ? "Volver al frente" : "Ver al dorso"}
          </button>

          <button
            type="button"
            onClick={() => flipTo(cardView === "qr" ? "back" : "qr")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-500)] bg-[var(--brand-500)] px-4 py-2 text-[0.92rem] font-medium text-[var(--navy-900)] transition hover:border-[#d4af66] hover:bg-[var(--navy-800)] hover:text-white"
          >
            <span className="text-base">{cardView === "qr" ? "◌" : "◍"}</span>
            {cardView === "qr" ? "Ocultar QR" : "Mostrar QR"}
          </button>
        </div>

      </div>
    </div>
  );
}
