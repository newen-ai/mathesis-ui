import Link from "next/link";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DesktopTopbarIcon } from "./DesktopTopbarIcons";
import { TopBarNavIcon } from "./TopBarNavIcon";
import {
  desktopAgoraMenuItems,
  desktopNexumMenuItems,
  desktopTopMenuItems,
  formatBadgeCount,
  type DesktopDropdownKey,
  type DesktopTopbarItem,
} from "./topbar.shared";

type TopBarDesktopProps = {
  desktopNavRef: RefObject<HTMLElement | null>;
  desktopTopbarItems: DesktopTopbarItem[];
  desktopDropdownOpen: DesktopDropdownKey | null;
  setDesktopDropdownOpen: Dispatch<SetStateAction<DesktopDropdownKey | null>>;
  isNavItemActive: (href: string) => boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  userProfileImageUrl: string | null;
  userInitials: string;
  userName: string;
  userIdentityLine: string;
  isLoadingUserName: boolean;
  onLogout: () => Promise<void>;
};

function DesktopDropdownMenu({
  items,
  isNavItemActive,
  onClose,
}: {
  items: typeof desktopNexumMenuItems;
  isNavItemActive: (href: string) => boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.4rem)] z-[80] w-[21rem] rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      {items.map((menuItem) => {
        const hasRoute = Boolean(menuItem.href);
        const active = menuItem.href ? isNavItemActive(menuItem.href) : false;
        const commonClass = `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
          active ? "bg-[var(--surface-muted)]" : ""
        } ${menuItem.disabledText ? "cursor-default opacity-70" : "hover:bg-[var(--surface-2)]"}`;

        const content = (
          <>
            <span className="flex items-center gap-2.5 text-scale-3 font-semibold text-[var(--text-primary)]">
              <span className="text-[var(--text-secondary)]">
                <TopBarNavIcon icon={menuItem.icon} />
              </span>
              {menuItem.label}
            </span>
            {menuItem.disabledText ? (
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[0.6rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">
                {menuItem.disabledText}
              </span>
            ) : null}
          </>
        );

        if (hasRoute && menuItem.href) {
          return (
            <Link
              key={`desktop-menu-${menuItem.label}`}
              href={menuItem.href}
              className={commonClass}
              onClick={onClose}
            >
              {content}
            </Link>
          );
        }

        return (
          <button key={`desktop-menu-${menuItem.label}`} type="button" className={commonClass} disabled>
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function TopBarDesktop({
  desktopNavRef,
  desktopTopbarItems,
  desktopDropdownOpen,
  setDesktopDropdownOpen,
  isNavItemActive,
  unreadMessagesCount,
  unreadNotificationsCount,
  userProfileImageUrl,
  userInitials,
  userName,
  userIdentityLine,
  isLoadingUserName,
  onLogout,
}: TopBarDesktopProps) {
  return (
    <nav ref={desktopNavRef} className="ml-auto hidden items-start gap-1.5 md:flex">
      {desktopTopbarItems.map((item) => {
        if (item.href) {
          const active = isNavItemActive(item.href);
          const badgeCount =
            item.showBadge === "messages"
              ? unreadMessagesCount
              : item.showBadge === "notifications"
                ? unreadNotificationsCount
                : 0;

          return (
            <Link key={item.id} href={item.href} className={`mathesis-nav-item ${active ? "is-active" : ""}`}>
              <span className="relative mathesis-nav-icon" aria-hidden="true">
                <DesktopTopbarIcon name={item.icon} />
                {badgeCount > 0 ? (
                  <span className="absolute -right-2 -top-2 min-w-[1.1rem] rounded-full bg-[var(--danger-500)] px-1.5 py-[0.12rem] text-center text-[0.62rem] font-bold leading-none text-white">
                    {formatBadgeCount(badgeCount)}
                  </span>
                ) : null}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        }

        const isOpen = desktopDropdownOpen === item.menuKey;

        return (
          <div key={item.id} className="relative">
            <button
              type="button"
              onClick={() =>
                setDesktopDropdownOpen((current) =>
                  current === item.menuKey ? null : item.menuKey ?? null
                )
              }
              className={`mathesis-nav-item ${isOpen ? "is-active" : ""}`}
            >
              <span className="mathesis-nav-icon" aria-hidden="true">
                <DesktopTopbarIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>

            {item.menuKey === "nexum" && isOpen ? (
              <DesktopDropdownMenu
                items={desktopNexumMenuItems}
                isNavItemActive={isNavItemActive}
                onClose={() => setDesktopDropdownOpen(null)}
              />
            ) : null}

            {item.menuKey === "agora" && isOpen ? (
              <DesktopDropdownMenu
                items={desktopAgoraMenuItems}
                isNavItemActive={isNavItemActive}
                onClose={() => setDesktopDropdownOpen(null)}
              />
            ) : null}
          </div>
        );
      })}

      <div className="relative ml-1">
        <button
          type="button"
          onClick={() =>
            setDesktopDropdownOpen((current) => (current === "profile" ? null : "profile"))
          }
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)]"
          aria-label="Abrir menú de perfil"
        >
          <UserAvatar
            imageUrl={userProfileImageUrl}
            initials={userInitials}
            label="Foto de perfil"
            className="flex h-full w-full items-center justify-center"
            initialsClassName="text-lg font-bold text-[var(--brand-500)]"
          />
        </button>

        {desktopDropdownOpen === "profile" ? (
          <aside className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] h-fit max-h-[calc(100dvh-6.85rem)] w-[min(90vw,23.4rem)] overflow-y-auto rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <p className="font-[family-name:var(--font-spectral)] text-[var(--menu-profile-name-size)] font-semibold leading-[1.05] mathesis-heading-primary">
                {isLoadingUserName ? "Cargando..." : userName || "Mi perfil"}
              </p>
              <p className="mt-1 text-[var(--menu-profile-meta-size)] font-semibold leading-[1.15] text-[var(--text-secondary)]">
                {userIdentityLine || "Miembro de Mathesis"}
              </p>
            </div>

            <div className="py-1.5">
              {desktopTopMenuItems.map((item) => {
                const isActive = item.href ? isNavItemActive(item.href) : false;
                const itemClass = `flex w-full items-center justify-between px-5 py-2.5 text-left transition hover:bg-[var(--surface-2)] active:bg-[var(--surface-muted)] ${
                  isActive ? "bg-[var(--surface-muted)]" : ""
                }`;

                const content = (
                  <span className="flex items-center gap-2.5 text-[var(--menu-item-size)] font-semibold leading-none text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">
                      <TopBarNavIcon icon={item.icon} />
                    </span>
                    {item.label}
                  </span>
                );

                if (item.href) {
                  return (
                    <Link
                      key={`desktop-top-${item.label}`}
                      href={item.href}
                      className={itemClass}
                      onClick={() => setDesktopDropdownOpen(null)}
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

            <div className="border-t border-[var(--line)] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  void onLogout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl py-1.5 text-left text-[var(--menu-logout-size)] font-semibold text-[var(--danger-500)] transition hover:bg-[color:color-mix(in_srgb,var(--danger-500)_8%,transparent)]"
              >
                <span aria-hidden="true">
                  <TopBarNavIcon icon="logout" />
                </span>
                Cerrar sesión
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </nav>
  );
}
