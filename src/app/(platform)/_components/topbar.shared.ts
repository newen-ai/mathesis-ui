import type { CompaniesMembershipState } from "@/lib/api/admin";
import type { DesktopTopbarIconName } from "./DesktopTopbarIcons";

type TopBarMenuItem = {
  label: string;
  labelKey?: string;
  href?: string;
  icon: string;
  disabledText?: string;
  disabledTextKey?: string;
  activeAuxText?: string;
};

type DesktopDropdownKey = "nexum" | "agora" | "profile";

type MobileAccordionKey = "profile" | "companies" | "ateneo" | "account-admin";

type MembershipCtaMode = "loading" | "request" | "requested" | "go";

type DesktopTopbarItem = {
  id: string;
  label: string;
  labelKey?: string;
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
    labelKey: "topbar:items.messages",
    icon: "message",
    showBadge: "messages",
  },
  {
    id: "notifications",
    href: "/notificaciones",
    label: "Notificaciones",
    labelKey: "topbar:items.notifications",
    icon: "bell",
    showBadge: "notifications",
  },
];

const desktopDropdownTopbarItems: DesktopTopbarItem[] = [
  { id: "nexum", label: "Nexum", labelKey: "topbar:items.nexum", icon: "nexum", menuKey: "nexum" },
  { id: "agora", label: "Agora", labelKey: "topbar:items.agora", icon: "agora", menuKey: "agora" },
];

const desktopAdminTopbarItem: DesktopTopbarItem = {
  id: "admin",
  href: "/admin",
  label: "Admin",
  labelKey: "topbar:items.admin",
  icon: "admin",
};

const desktopCompaniesAdminTopbarItem: DesktopTopbarItem = {
  id: "companies-admin",
  href: "/admin/companies-admin",
  label: "ME Admin",
  labelKey: "topbar:items.companiesAdmin",
  icon: "admin",
};

const desktopNexumMenuItems: TopBarMenuItem[] = [
  { label: "Mi Perfil Profesional", labelKey: "topbar:nexum.myProfile", href: "/perfil", icon: "user" },
  { label: "Bolsa de Trabajo", labelKey: "topbar:nexum.jobs", icon: "briefcase", disabledText: "PRÓXIMAMENTE", disabledTextKey: "topbar:common.comingSoon" },
  { label: "Directorio de Empresas", labelKey: "topbar:nexum.directory", href: "/directorio", icon: "building" },
  { label: "Mis Empresas", labelKey: "topbar:nexum.myCompanies", href: "/my-enterprises", icon: "building" },
];

const desktopAgoraMenuItems: TopBarMenuItem[] = [
  { label: "Ateneo", labelKey: "topbar:agora.ateneo", href: "/ateneo", icon: "groups" },
  { label: "Acertijos", labelKey: "topbar:agora.riddles", icon: "puzzle", disabledText: "PRÓXIMAMENTE", disabledTextKey: "topbar:common.comingSoon" },
  { label: "Afinitas", labelKey: "topbar:agora.affinitas", icon: "users-soft", disabledText: "PRÓXIMAMENTE", disabledTextKey: "topbar:common.comingSoon" },
  {
    label: "Buscar Usuarios (avanzada)",
    labelKey: "topbar:agora.advancedSearch",
    icon: "search",
    disabledText: "PRÓXIMAMENTE",
    disabledTextKey: "topbar:common.comingSoon",
  },
  { label: "Convivium", labelKey: "topbar:agora.convivium", icon: "cup", disabledText: "PRÓXIMAMENTE", disabledTextKey: "topbar:common.comingSoon" },
];

const desktopTopMenuItems: TopBarMenuItem[] = [
  { label: "Mi Perfil", labelKey: "topbar:profile.myProfile", href: "/perfil", icon: "user" },
  { label: "Digital credential", labelKey: "topbar:profile.digitalCredential", href: "/perfil/credencial", icon: "badge" },
  { label: "Configuración", labelKey: "topbar:profile.settings", href: "/account/configuration", icon: "settings" },
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
