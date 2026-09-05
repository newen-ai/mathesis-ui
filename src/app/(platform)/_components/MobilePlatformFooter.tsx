"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TopBarNavIcon } from "./TopBarNavIcon";

type FooterOverlayKey = "nexum" | "agora";

type OverlayItem = {
  label: string;
  description: string;
  icon: string;
  href?: string;
  disabled?: boolean;
  isSelected?: boolean;
};

const POWERED_BY_OFFSET = "1.9rem";
const FOOTER_MENU_HEIGHT = "4.4rem";
const SHEET_BOTTOM = `calc(${POWERED_BY_OFFSET} + max(env(safe-area-inset-bottom), 0.35rem) + ${FOOTER_MENU_HEIGHT})`;

const nexumOverlayItems: OverlayItem[] = [
  {
    label: "Tu Perfil Profesional",
    description: "CV, experiencia y verificación Mensa",
    icon: "user",
    href: "/perfil",
    isSelected: true,
  },
  {
    label: "Bolsa de Trabajo",
    description: "Búsquedas publicadas por Mensa Empresarios",
    icon: "briefcase",
    disabled: true,
  },
  {
    label: "Empresas",
    description: "Directorio de Mensa Empresarios",
    icon: "building",
    href: "/directorio",
  },
];

const agoraOverlayItems: OverlayItem[] = [
  {
    label: "Ateneo",
    description: "Grupos de conversación temática",
    icon: "groups",
    href: "/ateneo",
    isSelected: true,
  },
  {
    label: "Acertijos",
    description: "Retos y juegos de ingenio de la comunidad",
    icon: "puzzle",
    disabled: true,
  },
  {
    label: "Affinitas",
    description: "Match por afinidad e intereses compartidos",
    icon: "users-soft",
    disabled: true,
  },
  {
    label: "Buscar Usuarios (avanzada)",
    description: "Filtros por especialidad, país e intereses",
    icon: "search",
    disabled: true,
  },
  {
    label: "Convivium",
    description: "Eventos y encuentros de la comunidad",
    icon: "cup",
    disabled: true,
  },
];

function OverlayRow({
  item,
  onNavigate,
}: {
  item: OverlayItem;
  onNavigate: () => void;
}) {
  const content = (
    <>
      <span
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          item.disabled
            ? "bg-[var(--surface-muted)] text-[var(--text-soft)]"
            : "bg-[var(--navy-900)] text-[var(--brand-500)]",
        ].join(" ")}
      >
        <TopBarNavIcon icon={item.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-scale-1 font-semibold leading-tight text-[var(--heading-primary)]">{item.label}</span>
        <span className="mt-0.5 block text-[0.68rem] leading-tight text-[var(--text-secondary)]">{item.description}</span>
      </span>
      {item.disabled ? (
        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.5rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">
          PRÓXIMAMENTE
        </span>
      ) : item.isSelected ? (
        <span className="text-[var(--brand-700)]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
      ) : null}
    </>
  );

  const className = [
    "flex w-full items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5 text-left",
    item.disabled
      ? "cursor-default opacity-85"
      : "bg-[color:color-mix(in_srgb,var(--brand-100)_40%,var(--surface))] hover:bg-[color:color-mix(in_srgb,var(--brand-100)_58%,var(--surface))]",
  ].join(" ");

  if (item.disabled || !item.href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function FooterAction({
  active,
  label,
  icon,
  onClick,
  isCreate,
}: {
  active?: boolean;
  label: string;
  icon: string;
  onClick: () => void;
  isCreate?: boolean;
}) {
  if (isCreate) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center text-scale-1 font-medium text-[var(--text-secondary)]"
      >
        <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-500)] text-[var(--navy-900)] shadow-[0_6px_14px_rgba(0,0,0,0.14)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-scale-1 leading-none">Crear</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full flex-col items-center text-scale-1 font-medium",
        active ? "text-[var(--brand-700)]" : "text-[var(--text-secondary)]",
      ].join(" ")}
    >
      <span className="mb-1.5 flex h-7 w-7 items-center justify-center">
        <TopBarNavIcon icon={icon} className="h-6 w-6" />
      </span>
      <span className="whitespace-nowrap text-scale-1 leading-none">{label}</span>
    </button>
  );
}

export function MobilePlatformFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const [openOverlay, setOpenOverlay] = useState<FooterOverlayKey | null>(null);

  const overlayConfig = useMemo(() => {
    if (openOverlay === "nexum") {
      return {
        title: "Nexum",
        items: nexumOverlayItems,
      };
    }

    if (openOverlay === "agora") {
      return {
        title: "Agora",
        items: agoraOverlayItems,
      };
    }

    return null;
  }, [openOverlay]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOverlay(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!openOverlay) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobileViewport) {
      return;
    }

    document.body.style.setProperty("overflow", "hidden");
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [openOverlay]);

  useEffect(() => {
    const onCloseRequest = () => {
      setOpenOverlay(null);
    };

    window.addEventListener("mathesis:close-mobile-footer-overlay-request", onCloseRequest);
    return () => {
      window.removeEventListener("mathesis:close-mobile-footer-overlay-request", onCloseRequest);
    };
  }, []);

  const openSectionOverlay = (section: FooterOverlayKey) => {
    window.dispatchEvent(new Event("mathesis:close-mobile-drawer-request"));
    setOpenOverlay((current) => (current === section ? null : section));
  };

  const navigateToCreate = () => {
    setOpenOverlay(null);
    router.push("/ateneo/new-topic?source=footer");
  };

  const closeOverlay = () => {
    setOpenOverlay(null);
  };

  const isMessagesActive = pathname.startsWith("/mensajes");
  const isProfileActive = pathname.startsWith("/perfil");
  const isCreateActive =
    pathname === "/ateneo/new-topic" ||
    /^\/ateneo\/groups\/[^/]+\/new-topic$/.test(pathname);

  return (
    <>
      {overlayConfig ? (
        <div className="fixed inset-0 z-[105] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-x-0 top-0"
            style={{
              bottom: SHEET_BOTTOM,
              backgroundColor: "rgba(15, 28, 45, 0.42)",
            }}
            onClick={closeOverlay}
          />

          <section
            className="absolute inset-x-0 rounded-t-[1.6rem] border-t-4 border-[var(--brand-500)] bg-[var(--surface)] px-3 pb-3 pt-3"
            style={{ bottom: SHEET_BOTTOM }}
            aria-label={`${overlayConfig.title} menú`}
          >
            <h2 className="px-1 font-[family-name:var(--font-spectral)] text-scale-3 font-semibold leading-none text-[var(--heading-primary)]">
              {overlayConfig.title}
            </h2>
            <div className="mt-2.5 space-y-2">
              {overlayConfig.items.map((item) => (
                <OverlayRow key={item.label} item={item} onNavigate={closeOverlay} />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 z-[120] min-h-[4.4rem] border-b border-t border-[var(--line)] bg-[var(--surface)] px-2 pt-2 md:hidden"
        style={{ bottom: POWERED_BY_OFFSET, paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}
        aria-label="Navegación inferior"
      >
        <ul className="grid grid-cols-5 items-end gap-1 px-1 text-center">
          <li>
            <FooterAction
              label="Nexum"
              icon="nexum"
              active={openOverlay === "nexum"}
              onClick={() => openSectionOverlay("nexum")}
            />
          </li>
          <li>
            <FooterAction
              label="Agora"
              icon="agora"
              active={openOverlay === "agora"}
              onClick={() => openSectionOverlay("agora")}
            />
          </li>
          <li>
            <FooterAction
              label="Crear"
              icon=""
              isCreate
              active={isCreateActive}
              onClick={navigateToCreate}
            />
          </li>
          <li>
            <FooterAction
              label="Mensajes"
              icon="message"
              active={isMessagesActive}
              onClick={() => {
                closeOverlay();
                router.push("/mensajes");
              }}
            />
          </li>
          <li>
            <FooterAction
              label="Perfil"
              icon="user"
              active={isProfileActive}
              onClick={() => {
                closeOverlay();
                router.push("/perfil");
              }}
            />
          </li>
        </ul>
      </nav>
    </>
  );
}