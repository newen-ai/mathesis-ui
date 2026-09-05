import type { CompaniesMembershipState } from "@/lib/api/admin";
import type { DesktopTopbarIconName } from "./DesktopTopbarIcons";

type TopBarMenuItem = {
  label: string;
  href?: string;
  icon: string;
  disabledText?: string;
  activeAuxText?: string;
};

type DesktopDropdownKey = "nexum" | "agora" | "profile";

type MobileAccordionKey = "profile" | "companies" | "ateneo" | "account-admin";

type MembershipCtaMode = "loading" | "request" | "requested" | "go";

type DesktopTopbarItem = {
  id: string;
  label: string;
  icon: DesktopTopbarIconName;
  href?: string;
  menuKey?: DesktopDropdownKey;
  showBadge?: "messages" | "notifications";
};

const desktopBaseTopbarItems: DesktopTopbarItem[] = [
  {
    id: "messages",
    href: "/mensajes",
    label: "Mensajes",
    icon: "message",
    showBadge: "messages",
  },
  {
    id: "notifications",
    href: "/notificaciones",
    label: "Notificaciones",
    icon: "bell",
    showBadge: "notifications",
  },
];

const desktopDropdownTopbarItems: DesktopTopbarItem[] = [
  { id: "nexum", label: "Nexum", icon: "nexum", menuKey: "nexum" },
  { id: "agora", label: "Agora", icon: "agora", menuKey: "agora" },
];

const desktopAdminTopbarItem: DesktopTopbarItem = {
  id: "admin",
  href: "/admin",
  label: "Admin",
  icon: "admin",
};

const desktopCompaniesAdminTopbarItem: DesktopTopbarItem = {
  id: "companies-admin",
  href: "/admin/companies-admin",
  label: "ME Admin",
  icon: "admin",
};

const desktopNexumMenuItems: TopBarMenuItem[] = [
  { label: "Mi Perfil Profesional", href: "/perfil", icon: "user" },
  { label: "Bolsa de Trabajo", icon: "briefcase", disabledText: "PRÓXIMAMENTE" },
  { label: "Directorio de Empresas", href: "/directorio", icon: "building" },
  { label: "Mis Empresas", href: "/my-enterprises", icon: "building" },
];

const desktopAgoraMenuItems: TopBarMenuItem[] = [
  { label: "Ateneo", href: "/ateneo", icon: "groups" },
  { label: "Acertijos", icon: "puzzle", disabledText: "PRÓXIMAMENTE" },
  { label: "Afinitas", icon: "users-soft", disabledText: "PRÓXIMAMENTE" },
  {
    label: "Buscar Usuarios (avanzada)",
    icon: "search",
    disabledText: "PRÓXIMAMENTE",
  },
  { label: "Convivium", icon: "cup", disabledText: "PRÓXIMAMENTE" },
];

const desktopTopMenuItems: TopBarMenuItem[] = [
  { label: "Mi Perfil", href: "/perfil", icon: "user" },
  { label: "Configuración", href: "/account/configuration", icon: "settings" },
];

function formatBadgeCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

function resolveMembershipCtaMode(state: CompaniesMembershipState): MembershipCtaMode {
  if (state.hasBadge) return "go";
  if (state.hasOpenRequest) return "requested";
  return "request";
}

export {
  desktopAdminTopbarItem,
  desktopAgoraMenuItems,
  desktopBaseTopbarItems,
  desktopCompaniesAdminTopbarItem,
  desktopDropdownTopbarItems,
  desktopNexumMenuItems,
  desktopTopMenuItems,
  formatBadgeCount,
  resolveMembershipCtaMode,
};

export type {
  DesktopDropdownKey,
  DesktopTopbarItem,
  MembershipCtaMode,
  MobileAccordionKey,
  TopBarMenuItem,
};
