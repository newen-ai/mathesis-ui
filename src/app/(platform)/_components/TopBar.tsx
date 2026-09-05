"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavItem } from "../_lib/constants";
import {
  checkCompaniesAdminAccess,
  createCompaniesMembershipRequest,
  getCompaniesMembershipState,
} from "@/lib/api/admin";
import { getSessionAccessDecision, logout, type SessionRole } from "@/lib/api/auth";
import { BRAND_LOGO_FULL_SRC, BRAND_LOGO_SRC } from "@/lib/assets";
import { listMyChats } from "@/lib/api/chat";
import { listNotifications } from "@/lib/api/notifications";
import {
  ProfileHttpError,
  type BadgeOutput,
  getMyProfile,
  searchProfiles,
  type SearchProfileOutput,
} from "@/lib/api/profile";
import { useUiTheme } from "@/lib/theme/useUiTheme";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getTwoInitials } from "@/lib/utils/name";
import { formatBadgeSlug } from "@/lib/utils/badge";
import { toast } from "sonner";
import { TopBarDesktop } from "./TopBarDesktop";
import { TopBarMobile } from "./TopBarMobile";
import { TopBarNavIcon } from "./TopBarNavIcon";
import {
  desktopAdminTopbarItem,
  desktopBaseTopbarItems,
  desktopCompaniesAdminTopbarItem,
  desktopDropdownTopbarItems,
  resolveMembershipCtaMode,
  type DesktopDropdownKey,
  type MembershipCtaMode,
  type MobileAccordionKey,
} from "./topbar.shared";

type TopBarProps = {
  navItems: NavItem[];
};

type SessionAccess = {
  role: SessionRole | null;
};

export function TopBar({ navItems }: TopBarProps) {
  void navItems;

  const pathname = usePathname();
  const router = useRouter();
  useUiTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] =
    useState<DesktopDropdownKey | null>(null);
  const [mobileExpandedPanel, setMobileExpandedPanel] =
    useState<MobileAccordionKey | null>(null);
  const [userName, setUserName] = useState("");
  const [userProfileImageUrl, setUserProfileImageUrl] = useState<string | null>(null);
  const [userIdentityLine, setUserIdentityLine] = useState("");
  const [userBadges, setUserBadges] = useState<BadgeOutput[]>([]);
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfileOutput[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sessionAccess, setSessionAccess] = useState<SessionAccess>({ role: null });
  const [hasCompaniesAdminAccess, setHasCompaniesAdminAccess] = useState(false);
  const [membershipCtaMode, setMembershipCtaMode] =
    useState<MembershipCtaMode>("loading");
  const [isMembershipActionPending, setIsMembershipActionPending] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const mobileDrawerRef = useRef<HTMLElement | null>(null);

  const normalizedSearchText = useMemo(() => searchText.trim(), [searchText]);
  const userInitials = useMemo(
    () => getTwoInitials({ fullName: userName, fallback: "M" }),
    [userName]
  );
  const isAdmin = sessionAccess.role === "admin";
  const activeBadges = useMemo(
    () => userBadges.map((badge) => `∫ ${formatBadgeSlug(badge.slug)}`),
    [userBadges]
  );

  const desktopTopbarItems = useMemo(() => {
    const items = [...desktopBaseTopbarItems];

    if (isAdmin) {
      items.push(desktopAdminTopbarItem);
    }

    if (hasCompaniesAdminAccess) {
      items.push(desktopCompaniesAdminTopbarItem);
    }

    items.push(...desktopDropdownTopbarItems);

    return items;
  }, [hasCompaniesAdminAccess, isAdmin]);

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

  const reloadMembershipState = useCallback(async (signal?: AbortSignal) => {
    const membershipState = await getCompaniesMembershipState(signal);
    setMembershipCtaMode(resolveMembershipCtaMode(membershipState));
  }, []);

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
    let isMounted = true;
    const controller = new AbortController();

    const loadCompaniesAccess = async () => {
      try {
        const { status } = await checkCompaniesAdminAccess(controller.signal);
        if (!isMounted || controller.signal.aborted) return;

        setHasCompaniesAdminAccess(status === 200);
      } catch {
        if (!isMounted || controller.signal.aborted) return;
        setHasCompaniesAdminAccess(false);
      }
    };

    void loadCompaniesAccess();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!mobileDrawerOpen) {
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
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (!mobileDrawerOpen && !desktopDropdownOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileDrawerOpen(false);
        setDesktopDropdownOpen(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [desktopDropdownOpen, mobileDrawerOpen]);

  useEffect(() => {
    if (!desktopDropdownOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const inDesktopTopbar = desktopNavRef.current?.contains(target);
      if (!inDesktopTopbar) {
        setDesktopDropdownOpen(null);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [desktopDropdownOpen]);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (desktopDropdownOpen) {
        const isInsideDesktopNav = desktopNavRef.current?.contains(target) ?? false;
        if (!isInsideDesktopNav) {
          setDesktopDropdownOpen(null);
        }
      }

      if (mobileDrawerOpen) {
        const isInsideMobileDrawer = mobileDrawerRef.current?.contains(target) ?? false;
        if (!isInsideMobileDrawer) {
          setMobileDrawerOpen(false);
          setMobileExpandedPanel(null);
        }
      }
    };

    window.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("focusin", onFocusIn);
    };
  }, [desktopDropdownOpen, mobileDrawerOpen]);

  useEffect(() => {
    let isMounted = true;

    const loadTopbarCounters = async () => {
      const [chatsResult, notificationsResult] = await Promise.allSettled([
        listMyChats(30),
        listNotifications(50),
      ]);

      if (!isMounted) {
        return;
      }

      if (chatsResult.status === "fulfilled") {
        const totalUnread = chatsResult.value.data.chats.reduce(
          (sum, chat) => sum + chat.unreadMessagesCount,
          0
        );
        setUnreadMessagesCount(totalUnread);
      }

      if (notificationsResult.status === "fulfilled") {
        setUnreadNotificationsCount(notificationsResult.value.data.unreadCount);
      }
    };

    void loadTopbarCounters();
    const intervalId = window.setInterval(() => {
      void loadTopbarCounters();
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
        setUserBadges(profile.badges ?? []);
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
        setUserBadges([]);
        setIsLoadingUserName(false);
      }
    };

    void loadCurrentUserName();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [forceLogout, router]);

  useEffect(() => {
    const controller = new AbortController();

    const loadMembershipState = async () => {
      try {
        await reloadMembershipState(controller.signal);
      } catch {
        setMembershipCtaMode("request");
      }
    };

    void loadMembershipState();

    return () => {
      controller.abort();
    };
  }, [reloadMembershipState]);

  const onSearchTextChange = (value: string) => {
    setSearchText(value);
    if (value.trim()) return;
    setSearchResults([]);
    setSearchMessage("");
    setIsSearching(false);
  };

  const toggleMobilePanel = (panel: MobileAccordionKey) => {
    setMobileExpandedPanel((current) => (current === panel ? null : panel));
  };

  const onRequestMembership = async () => {
    if (membershipCtaMode !== "request" || isMembershipActionPending) {
      return;
    }

    setIsMembershipActionPending(true);

    try {
      const result = await createCompaniesMembershipRequest();

      if (!result.success) {
        toast.error(result.message || "No se pudo enviar la solicitud.");
        return;
      }

      toast.success("Solicitud enviada.");
      await reloadMembershipState();
    } catch {
      toast.error("No pudimos actualizar tu membresía en este momento.");
    } finally {
      setIsMembershipActionPending(false);
    }
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
    setMobileExpandedPanel(null);
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
    <>
      <header className="mathesis-topbar sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center gap-3 px-4 md:h-[5.5rem] md:px-6 lg:px-8">
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
              <TopBarNavIcon icon="search" />
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
                        const selectedName = `${profile.firstName} ${profile.lastName}`.trim();
                        setSearchText(selectedName);
                        setSearchResults([]);
                        setSearchMessage("");
                        setMobileDrawerOpen(false);
                        setDesktopDropdownOpen(null);
                        router.push(`/perfil?userId=${encodeURIComponent(profile.userId)}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[var(--surface-2)]"
                    >
                      <UserAvatar
                        imageUrl={profile.profileImageUrl}
                        initials={getTwoInitials({
                          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
                          fallback: "M",
                        })}
                        label={`Foto de perfil de ${`${profile.firstName} ${profile.lastName}`.trim()}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-800)]"
                        initialsClassName="text-xs font-bold text-[var(--brand-300)]"
                      />
                      <span className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
                        {profile.firstName} {profile.lastName}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>

        <TopBarDesktop
          desktopNavRef={desktopNavRef}
          desktopTopbarItems={desktopTopbarItems}
          desktopDropdownOpen={desktopDropdownOpen}
          setDesktopDropdownOpen={setDesktopDropdownOpen}
          isNavItemActive={isNavItemActive}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotificationsCount={unreadNotificationsCount}
          userProfileImageUrl={userProfileImageUrl}
          userInitials={userInitials}
          userName={userName}
          userIdentityLine={userIdentityLine}
          isLoadingUserName={isLoadingUserName}
          onLogout={onLogout}
        />

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => {
              setDesktopDropdownOpen(null);
              setMobileDrawerOpen((current) => {
                if (current) {
                  setMobileExpandedPanel(null);
                }
                return !current;
              });
            }}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)]"
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--brand-500)]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      </header>

      <TopBarMobile
        mobileDrawerOpen={mobileDrawerOpen}
        mobileDrawerRef={mobileDrawerRef}
        closeMobileDrawer={closeMobileDrawer}
        mobileExpandedPanel={mobileExpandedPanel}
        toggleMobilePanel={toggleMobilePanel}
        userProfileImageUrl={userProfileImageUrl}
        userInitials={userInitials}
        isLoadingUserName={isLoadingUserName}
        userName={userName}
        userIdentityLine={userIdentityLine}
        activeBadges={activeBadges}
        membershipCtaMode={membershipCtaMode}
        isMembershipActionPending={isMembershipActionPending}
        onRequestMembership={onRequestMembership}
        hasCompaniesAdminAccess={hasCompaniesAdminAccess}
        isAdmin={isAdmin}
        onLogout={onLogout}
      />
    </>
  );
}
