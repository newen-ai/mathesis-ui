"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavItem } from "../_lib/constants";
import { getSessionAccessDecision, logout, type SessionRole } from "@/lib/api/auth";
import { BRAND_LOGO_FULL_SRC, BRAND_LOGO_SRC } from "@/lib/assets";
import {
  DesktopTopbarIcon,
  type DesktopTopbarIconName,
} from "./DesktopTopbarIcons";
import {
  ProfileHttpError,
  getMyProfile,
  searchProfiles,
  type SearchProfileOutput,
} from "@/lib/api/profile";
import { useUiTheme } from "@/lib/theme/useUiTheme";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getTwoInitials } from "@/lib/utils/name";

type TopBarProps = {
  navItems: NavItem[];
};

type SessionAccess = {
  role: SessionRole | null;
};

type TopBarMenuItem = {
  label: string;
  href?: string;
  icon: string;
  disabledText?: string;
  activeAuxText?: string;
};

type TopBarMenuSection = {
  title: string;
  items: TopBarMenuItem[];
};

type DesktopTopbarItem = {
  href: string;
  label: string;
  icon: DesktopTopbarIconName;
};

const desktopBaseTopbarItems: DesktopTopbarItem[] = [
  { href: "/", label: "Feed", icon: "feed" },
  { href: "/mensajes", label: "Mensajes", icon: "message" },
  { href: "/notificaciones", label: "Notificaciones", icon: "bell" },
];

const desktopAdminTopbarItem: DesktopTopbarItem = {
  href: "/admin",
  label: "Admin",
  icon: "admin",
};

const menuSections: TopBarMenuSection[] = [
  {
    title: "PERSONAL",
    items: [
      { label: "Feed", href: "/", icon: "grid" },
      { label: "Mensajes", href: "/mensajes", icon: "chat" },
      { label: "Notificaciones", href: "/notificaciones", icon: "bell" },
      { label: "Mi Perfil", href: "/perfil", icon: "user" },
      { label: "Buscar", href: "#", icon: "search" },
      { label: "Eventos", href: "#", icon: "calendar", disabledText: "proximamente" },
    ],
  },
  {
    title: "EMPRESARIAL",
    items: [
      { label: "Mis Empresas", href: "/my-enterprises", icon: "building" },
      { label: "Mathesis", href: "/red", icon: "mark" },
      { label: "Feed Empresarial", href: "#", icon: "doc", activeAuxText: "solo ME" },
    ],
  },
  {
    title: "MATHESIS",
    items: [{ label: "ABM de Mathesis", href: "#", icon: "sun" }],
  },
];

const desktopTopMenuItems: TopBarMenuItem[] = [
  { label: "Mi Perfil", href: "/perfil", icon: "user" },
  { label: "Configuración", href: "/account/configuration", icon: "settings" },
];

const accountMenuSection: TopBarMenuSection = {
  title: "CUENTA",
  items: [{ label: "Configuración", href: "/account/configuration", icon: "settings" }],
};

const desktopMenuSections: TopBarMenuSection[] = [
  {
    title: "EMPRESARIAL",
    items: [
      { label: "Mis Empresas", href: "/my-enterprises", icon: "building" },
      { label: "Mensa Empresarios", href: "/red", icon: "wave" },
      { label: "Feed Empresarial", href: "/", icon: "doc", activeAuxText: "solo ME" },
    ],
  },
  {
    title: "CUENTA",
    items: [
      { label: "Bloqueados", icon: "ban" },
      { label: "Contactar a Mathesis", icon: "message" },
    ],
  },
];

function NavIcon({ icon }: { icon: string }) {
  const className = "h-5 w-5";

  if (icon === "grid") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="6" rx="1.5" />
        <rect x="4" y="14" width="16" height="6" rx="1.5" />
      </svg>
    );
  }

  if (icon === "chat") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-8L5 20v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
      </svg>
    );
  }

  if (icon === "bell") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 17h8m-5.5 3h3" />
        <path d="M6.5 16h11l-1.2-1.9a4 4 0 0 1-.55-2.08v-1.3A4.3 4.3 0 0 0 12 6.5a4.3 4.3 0 0 0-3.75 4.23v1.3c0 .75-.2 1.5-.58 2.15L6.5 16Z" />
      </svg>
    );
  }

  if (icon === "user") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (icon === "search") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.3" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
        <path d="M8 3.5v4m8-4v4M4 10.5h16" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6" />
      </svg>
    );
  }

  if (icon === "building") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13M14 20h6V11.5a1 1 0 0 0-1-1h-5" />
        <path d="M8 10h2m-2 3h2m-2 3h2m6-2h2m-2 3h2" />
      </svg>
    );
  }

  if (icon === "mark") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M13.8 4.5c-3.8 0-6.2 2.5-6.2 5.7 0 2.9 1.9 4.9 4.7 4.9h.9c1.7 0 2.8 1 2.8 2.4 0 1.4-.9 2-2.2 2-1.4 0-2.5-.7-3.2-2" />
      </svg>
    );
  }

  if (icon === "doc") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
        <path d="M14 3.8v4h4" />
      </svg>
    );
  }

  if (icon === "wave") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 18c1.2 0 2-1.3 2-3.1 0-2.8 1.1-6.8 3.4-9.4" />
      </svg>
    );
  }

  if (icon === "ban") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="m7 7 10 10" />
      </svg>
    );
  }

  if (icon === "message") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
      </svg>
    );
  }

  if (icon === "logout") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M10 6H5.8A1.8 1.8 0 0 0 4 7.8v8.4A1.8 1.8 0 0 0 5.8 18H10" />
        <path d="M14 8.5 18 12l-4 3.5" />
        <path d="M9 12h9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4m0 3h.01" />
    </svg>
  );
}

export function TopBar({ navItems }: TopBarProps) {
  void navItems;

  const pathname = usePathname();
  const router = useRouter();
  useUiTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userProfileImageUrl, setUserProfileImageUrl] = useState<string | null>(null);
  const [userIdentityLine, setUserIdentityLine] = useState("");
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfileOutput[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sessionAccess, setSessionAccess] = useState<SessionAccess>({ role: null });

  const normalizedSearchText = useMemo(() => searchText.trim(), [searchText]);
  const userInitials = useMemo(
    () => getTwoInitials({ fullName: userName, fallback: "M" }),
    [userName]
  );
  const isAdmin = sessionAccess.role === "admin";

  const desktopTopbarItems = useMemo(() => {
    if (!isAdmin) {
      return desktopBaseTopbarItems;
    }

    return [...desktopBaseTopbarItems, desktopAdminTopbarItem];
  }, [isAdmin]);

  const isNavItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const forceLogout = useCallback(() => {
    router.replace("/login");
    router.refresh();
  }, [router]);

  const onLogout = async () => {
    await logout();
    forceLogout();
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadSessionAccess = async () => {
      try {
        const decision = await getSessionAccessDecision();
        if (!isMounted || controller.signal.aborted) return;

        setSessionAccess({ role: decision.role ?? null });
      } catch {
        if (!isMounted || controller.signal.aborted) return;
        setSessionAccess({ role: null });
      }
    };

    void loadSessionAccess();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
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
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadCurrentUserName = async () => {
      try {
        const profile = await getMyProfile(controller.signal);
        if (!isMounted) return;

        const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
        const subtitle = [profile.currentJobTitle, profile.currentCompany]
          .filter((value) => typeof value === "string" && value.trim().length > 0)
          .join(" · ");
        setUserName(fullName);
        setUserProfileImageUrl(profile.profileImageUrl ?? null);
        setUserIdentityLine(subtitle);
        setIsLoadingUserName(false);
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        if (
          error instanceof ProfileHttpError &&
          (error.status === 401 || error.status === 403)
        ) {
          if (
            error.status === 403 &&
            error.details?.code === "USER_NOT_WHITELISTED"
          ) {
            router.replace(error.details.redirectTo ?? "/whitelist-access");
            return;
          }

          await logout();
          forceLogout();
          return;
        }

        setUserName("");
        setUserProfileImageUrl(null);
        setUserIdentityLine("");
        setIsLoadingUserName(false);
      }
    };

    void loadCurrentUserName();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [forceLogout, router]);

  const onSearchTextChange = (value: string) => {
    setSearchText(value);
    if (value.trim()) return;
    setSearchResults([]);
    setSearchMessage("");
    setIsSearching(false);
  };

  useEffect(() => {
    if (!normalizedSearchText) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await searchProfiles(
          normalizedSearchText,
          controller.signal
        );

        if (!response.success) {
          setSearchResults([]);
          setSearchMessage(response.message || "No se pudo buscar perfiles");
          return;
        }

        setSearchResults(response.data);
        setSearchMessage(response.data.length === 0 ? "Sin resultados" : "");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setSearchResults([]);
        setSearchMessage("No se pudo buscar perfiles");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [normalizedSearchText]);

  const showSearchPanel =
    normalizedSearchText.length > 0 && (isSearching || searchResults.length > 0 || !!searchMessage);

  return (
    <header className="mathesis-topbar sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1350px] items-center gap-3 px-4 md:h-[5.5rem] md:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 transition hover:bg-[var(--surface-2)]/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_SRC}
            alt="Logo Mathesis"
            width={56}
            height={56}
            loading="eager"
            decoding="async"
            className="h-10 w-10 md:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_FULL_SRC}
            alt="Logo Mathesis"
            width={160}
            height={42}
            loading="eager"
            decoding="async"
            className="hidden h-14 w-auto max-w-none shrink-0 md:block lg:h-16"
          />
        </Link>

        <div className="relative ml-2 w-full max-w-[560px] min-w-0 md:ml-4">
          <label className="sr-only" htmlFor="topbar-search">
            Buscar perfiles
          </label>
          <div className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-2.5 md:py-3">
            <span className="text-[var(--text-soft)]" aria-hidden="true">
              <NavIcon icon="search" />
            </span>
            <input
              id="topbar-search"
              type="search"
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              placeholder="Buscar"
              className="w-full bg-transparent text-base font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)] md:text-xl"
              autoComplete="off"
            />
          </div>

          {showSearchPanel ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg">
              {isSearching ? (
                <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">Buscando...</p>
              ) : null}

              {!isSearching && searchMessage ? (
                <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">{searchMessage}</p>
              ) : null}

              {!isSearching && searchResults.length > 0
                ? searchResults.map((profile) => (
                    <button
                      key={profile.userId}
                      type="button"
                      onClick={() => {
                        const selectedName = `${profile.firstName} ${profile.lastName}`;
                        setSearchText(selectedName);
                        setSearchResults([]);
                        setSearchMessage("");
                        setDrawerOpen(false);
                        router.push(`/perfil?userId=${encodeURIComponent(profile.userId)}`);
                      }}
                      className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition hover:bg-[var(--surface-2)]"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {profile.firstName} {profile.lastName}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>

        <nav className="ml-auto hidden items-center gap-2 md:flex">
          {desktopTopbarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mathesis-nav-item ${
                isNavItemActive(item.href) ? "is-active" : ""
              }`}
            >
              <span className="mathesis-nav-icon" aria-hidden="true">
                <DesktopTopbarIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setDrawerOpen((current) => !current)}
            className="ml-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)]"
            aria-label="Abrir menu"
          >
            <UserAvatar
              imageUrl={userProfileImageUrl}
              initials={userInitials}
              label="Foto de perfil"
              className="flex h-full w-full items-center justify-center"
              initialsClassName="text-lg font-bold text-[var(--brand-500)]"
            />
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen((current) => !current)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)]"
            aria-label="Abrir menu"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--brand-500)]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] hidden bg-transparent md:block"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menu de escritorio"
          />

          <aside className="fixed right-4 top-[6.2rem] z-[70] hidden h-fit max-h-[calc(100dvh-6.85rem)] w-[min(90vw,23.4rem)] overflow-y-auto rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_22px_50px_rgba(0,0,0,0.18)] md:block">
            <div className="border-b border-[var(--line)] px-5 py-4.5">
              <p className="font-[family-name:var(--font-spectral)] text-[var(--menu-profile-name-size)] font-semibold leading-[1.05] text-[var(--navy-900)]">
                {isLoadingUserName ? "Cargando..." : userName || "Mi perfil"}
              </p>
              <p className="mt-1 text-[var(--menu-profile-meta-size)] font-semibold leading-[1.15] text-[var(--text-secondary)]">
                {userIdentityLine || "Miembro de Mathesis"}
              </p>
            </div>

            <div className="border-b border-[var(--line)] py-1.5">
              {desktopTopMenuItems.map((item) => {
                const isActive = item.href ? isNavItemActive(item.href) : false;
                    const itemClass = `flex w-full items-center justify-between px-5 py-2.5 text-left transition hover:bg-[var(--surface-2)] active:bg-[var(--surface-muted)] ${
                  isActive ? "bg-[var(--surface-muted)]" : ""
                }`;

                const content = (
                  <>
                        <span className="flex items-center gap-2.5 text-[var(--menu-item-size)] font-semibold leading-none text-[var(--text-primary)]">
                      <span className="text-[var(--text-secondary)]">
                        <NavIcon icon={item.icon} />
                      </span>
                      {item.label}
                    </span>
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={`desktop-top-${item.label}`}
                      href={item.href}
                      className={itemClass}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={`desktop-top-${item.label}`} type="button" className={itemClass}>
                    {content}
                  </button>
                );
              })}
            </div>

            {desktopMenuSections.map((section) => (
              <section key={`desktop-${section.title}`} className="border-b border-[var(--line)] py-1.5">
                <h4 className="px-5 pb-1.5 pt-2.5 text-[var(--menu-section-size)] font-bold tracking-[0.16em] text-[var(--text-soft)]">{section.title}</h4>
                {section.items.map((item) => {
                  const isActive = item.href ? isNavItemActive(item.href) : false;
                  const itemClass = `flex w-full items-center justify-between px-5 py-2.5 text-left transition hover:bg-[var(--surface-2)] active:bg-[var(--surface-muted)] ${
                    isActive ? "bg-[var(--surface-muted)]" : ""
                  }`;
                  const content = (
                    <>
                      <span className="flex items-center gap-2.5 text-[var(--menu-item-size)] font-semibold leading-none text-[var(--text-primary)]">
                        <span className="text-[var(--text-secondary)]">
                          <NavIcon icon={item.icon} />
                        </span>
                        {item.label}
                      </span>
                      {item.activeAuxText ? (
                        <span className="text-[0.64rem] font-semibold text-[color:color-mix(in_srgb,var(--brand-500)_72%,#5f4e2a)]">{item.activeAuxText}</span>
                      ) : null}
                    </>
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={`desktop-${section.title}-${item.label}`}
                        href={item.href}
                        className={itemClass}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button key={`desktop-${section.title}-${item.label}`} type="button" className={itemClass}>
                      {content}
                    </button>
                  );
                })}
              </section>
            ))}

            <div className="px-5 py-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-xl py-1.5 text-left text-[var(--menu-logout-size)] font-semibold text-[var(--danger-500)] transition hover:bg-[color:color-mix(in_srgb,var(--danger-500)_8%,transparent)]"
              >
                <span aria-hidden="true">
                  <NavIcon icon="logout" />
                </span>
                Cerrar sesión
              </button>
            </div>
          </aside>

          <button
            type="button"
            className="fixed inset-0 z-[60] bg-[var(--accent-overlay)] md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menu"
          />
          <aside className="fixed right-0 top-[6.2rem] z-[70] h-[calc(100dvh-6.2rem)] w-[78vw] max-w-[420px] overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] md:hidden">
            <div className="border-b border-[var(--line)] bg-[var(--navy-900)] p-6 text-white">
              <div className="flex items-start gap-4">
                <UserAvatar
                  imageUrl={userProfileImageUrl}
                  initials={userInitials}
                  label="Foto de perfil"
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)]"
                  initialsClassName="text-3xl font-semibold text-[var(--brand-500)]"
                />
                <div>
                  <p className="font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-none">
                    {isLoadingUserName ? "Cargando..." : userName || "Mi perfil"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
                    {userIdentityLine || "Miembro de Mathesis"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--line-strong)] px-4 py-1 text-xs font-semibold text-[var(--brand-500)]">∫ Mathesis</span>
                <span className="rounded-full border border-[var(--line-strong)] px-4 py-1 text-xs font-semibold text-[var(--text-secondary)]">MTH-0001</span>
              </div>
            </div>

            {menuSections.map((section) => (
              <section key={section.title} className="border-b border-[var(--line)]">
                <h4 className="px-6 py-3 text-xs font-bold tracking-[0.16em] text-[var(--brand-500)]">{section.title}</h4>
                {section.items.map((item) => {
                  const routeHref = item.href ?? "#";
                  const hasRoute = routeHref !== "#";
                  const active = hasRoute ? isNavItemActive(routeHref) : false;
                  const commonClass = `flex w-full items-center justify-between border-t border-[color:color-mix(in_srgb,var(--line)_65%,transparent)] px-6 py-4 text-left ${
                    active ? "bg-[var(--surface-muted)]" : "bg-[var(--surface)]"
                  } ${item.disabledText ? "opacity-60" : ""}`;

                  const content = (
                    <>
                      <span className="flex items-center gap-4 text-xl font-medium text-[var(--text-primary)]">
                        <span className="text-[var(--text-secondary)]">
                          <NavIcon icon={item.icon} />
                        </span>
                        {item.label}
                      </span>
                      {item.disabledText ? (
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">{item.disabledText}</span>
                      ) : null}
                      {item.activeAuxText ? (
                        <span className="text-xs font-semibold text-[var(--brand-500)]">{item.activeAuxText}</span>
                      ) : null}
                    </>
                  );

                  if (!hasRoute) {
                    return (
                      <button key={`${section.title}-${item.label}`} type="button" className={commonClass}>
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={`${section.title}-${item.label}`}
                      href={routeHref}
                      className={commonClass}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {content}
                    </Link>
                  );
                })}
              </section>
            ))}

            {isAdmin ? (
              <section className="border-b border-[var(--line)]">
                <h4 className="px-6 py-3 text-xs font-bold tracking-[0.16em] text-[var(--brand-500)]">ADMIN</h4>
                <Link
                  href="/admin"
                  className={`flex w-full items-center justify-between border-t border-[color:color-mix(in_srgb,var(--line)_65%,transparent)] px-6 py-4 text-left ${
                    isNavItemActive("/admin") ? "bg-[var(--surface-muted)]" : "bg-[var(--surface)]"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="flex items-center gap-4 text-xl font-medium text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">
                      <NavIcon icon="mark" />
                    </span>
                    Admin dashboard
                  </span>
                </Link>
              </section>
            ) : null}

            <section className="border-b border-[var(--line)]">
              <h4 className="px-6 py-3 text-xs font-bold tracking-[0.16em] text-[var(--brand-500)]">
                {accountMenuSection.title}
              </h4>
              {accountMenuSection.items.map((item) => (
                <Link
                  key={`mobile-${item.label}`}
                  href={item.href ?? "#"}
                  className={`flex w-full items-center justify-between border-t border-[color:color-mix(in_srgb,var(--line)_65%,transparent)] px-6 py-4 text-left ${
                    item.href && isNavItemActive(item.href)
                      ? "bg-[var(--surface-muted)]"
                      : "bg-[var(--surface)]"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="flex items-center gap-4 text-xl font-medium text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">
                      <NavIcon icon={item.icon} />
                    </span>
                    {item.label}
                  </span>
                </Link>
              ))}
            </section>

            <div className="space-y-3 border-t border-[var(--line)] p-5">
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-xl border border-[color:color-mix(in_srgb,var(--danger-500)_35%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--danger-500)]"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </header>
  );
}
