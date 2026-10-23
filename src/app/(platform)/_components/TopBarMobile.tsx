import Link from "next/link";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AteneoGroup } from "@/lib/api/ateneo";
import { TopBarNavIcon } from "./TopBarNavIcon";
import type { MembershipCtaMode, MobileAccordionKey } from "./topbar.shared";

type TopBarMobileProps = {
  mobileDrawerOpen: boolean;
  mobileDrawerRef: RefObject<HTMLElement | null>;
  closeMobileDrawer: () => void;
  mobileExpandedPanel: MobileAccordionKey | null;
  toggleMobilePanel: (panel: MobileAccordionKey) => void;
  userProfileImageUrl: string | null;
  userInitials: string;
  isLoadingUserName: boolean;
  userName: string;
  userIdentityLine: string;
  activeBadges: string[];
  membershipCtaMode: MembershipCtaMode;
  isMembershipActionPending: boolean;
  onRequestMembership: () => Promise<void>;
  onCancelMembership: () => Promise<void>;
  hasCompaniesAdminAccess: boolean;
  isAdmin: boolean;
  ateneoAdminGroups: AteneoGroup[];
  ateneoMineGroups: AteneoGroup[];
  onLogout: () => Promise<void>;
};

function AteneoGroupMenuLink({
  group,
  closeMobileDrawer,
}: {
  group: AteneoGroup;
  closeMobileDrawer: () => void;
}) {
  return (
    <Link
      href={`/ateneo/groups/${encodeURIComponent(group.id)}`}
      onClick={closeMobileDrawer}
      className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
        <TopBarNavIcon icon={group.isOfficial ? "cup" : "groups"} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-scale-3 text-[var(--text-primary)]">{group.name}</span>
        {group.isOfficial ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--brand-100)_75%,var(--surface))] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--brand-900)]">
            Oficial
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function DisabledMenuRow({ label, icon }: { label: string; icon: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-soft)] opacity-80">
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-soft)]">
          <TopBarNavIcon icon={icon} />
        </span>
        {label}
      </span>
      <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">
        {t("topbar:common.comingSoon", { defaultValue: "PRÓXIMAMENTE" })}
      </span>
    </div>
  );
}

function MembershipRequestActionRow({
  membershipCtaMode,
  isMembershipActionPending,
  onRequestMembership,
  onCancelMembership,
}: {
  membershipCtaMode: MembershipCtaMode;
  isMembershipActionPending: boolean;
  onRequestMembership: () => Promise<void>;
  onCancelMembership: () => Promise<void>;
}) {
  const { t } = useTranslation();

  if (membershipCtaMode === "go") {
    return null;
  }

  const isRequestMode = membershipCtaMode === "request";
  const isRequestedMode = membershipCtaMode === "requested";

  const onClick = () => {
    if (isRequestMode) {
      void onRequestMembership();
      return;
    }

    if (isRequestedMode) {
      void onCancelMembership();
    }
  };

  const label =
    membershipCtaMode === "loading"
      ? t("topbar:mobile.membership.loading", { defaultValue: "Cargando membresía..." })
      : isMembershipActionPending && isRequestMode
        ? t("topbar:mobile.membership.sending", { defaultValue: "Enviando solicitud..." })
        : isMembershipActionPending && isRequestedMode
          ? t("topbar:mobile.membership.removing", { defaultValue: "Quitando solicitud..." })
          : isRequestedMode
            ? t("topbar:mobile.membership.requested", { defaultValue: "Solicitud pendiente · Cancelar solicitud" })
            : t("topbar:mobile.membership.request", { defaultValue: "Solicitar Membresía" });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={membershipCtaMode === "loading" || isMembershipActionPending}
      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-scale-3 transition disabled:cursor-not-allowed disabled:opacity-70 ${
        isRequestedMode
          ? "text-[var(--danger-500)] hover:bg-[color:color-mix(in_srgb,var(--danger-500)_10%,transparent)]"
          : "text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
        <TopBarNavIcon icon="badge" />
      </span>
      {label}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span className="text-[var(--text-secondary)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        {open ? <path d="m6 9 6 6 6-6" /> : <path d="m9 6 6 6-6 6" />}
      </svg>
    </span>
  );
}

export function TopBarMobile({
  mobileDrawerOpen,
  mobileDrawerRef,
  closeMobileDrawer,
  mobileExpandedPanel,
  toggleMobilePanel,
  userProfileImageUrl,
  userInitials,
  isLoadingUserName,
  userName,
  userIdentityLine,
  activeBadges,
  membershipCtaMode,
  isMembershipActionPending,
  onRequestMembership,
  onCancelMembership,
  hasCompaniesAdminAccess,
  isAdmin,
  ateneoAdminGroups,
  ateneoMineGroups,
  onLogout,
}: TopBarMobileProps) {
  const { t } = useTranslation();

  if (!mobileDrawerOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-0 left-0 top-0 z-[120] w-[30vw] pointer-events-auto md:hidden"
        style={{ backgroundColor: "rgba(17, 43, 69, 0.72)" }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          closeMobileDrawer();
        }}
        aria-label={t("topbar:mobile.closeMenu", { defaultValue: "Cerrar menú" })}
      />
      <aside
        ref={mobileDrawerRef}
        className="fixed right-0 top-0 z-[130] h-[100dvh] w-[70vw] overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] md:hidden"
      >
        <div className="border-b border-[var(--line)] bg-[var(--surface)] px-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-3">
              <UserAvatar
                imageUrl={userProfileImageUrl}
                initials={userInitials}
                label={t("topbar:profile.photo", { defaultValue: "Foto de perfil" })}
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                initialsClassName="text-2xl font-semibold text-[var(--brand-500)]"
              />
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-spectral)] text-scale-5 font-semibold leading-tight sophium-heading-primary">
                  {isLoadingUserName
                    ? t("topbar:common.loading", { defaultValue: "Cargando..." })
                    : userName || t("topbar:profile.myProfile", { defaultValue: "Mi perfil" })}
                </p>
                <p className="text-scale-2 text-[var(--text-secondary)]">
                  {userIdentityLine || t("topbar:mobile.defaultIdentity", { defaultValue: "CEO · Sophium & Newen Solutions" })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobileDrawer}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              aria-label={t("topbar:mobile.closeMenu", { defaultValue: "Cerrar menú" })}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(activeBadges.length > 0 ? activeBadges : ["∫ Mensa AR"]).slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_62%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--brand-900)]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 px-3 py-3 pb-8">
          <section>
            <h3 className="px-1 font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              {t("topbar:mobile.nexum.title", { defaultValue: "Nexum · tu red profesional" })}
            </h3>

            <div className="mt-2 space-y-2">
              <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_2px_color-mix(in_srgb,var(--navy-900)_9%,transparent)]">
                <button
                  type="button"
                  onClick={() => toggleMobilePanel("profile")}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[var(--brand-500)]">
                      <TopBarNavIcon icon="user" />
                    </span>
                    <span>
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">{t("topbar:mobile.nexum.profile.title", { defaultValue: "Tu Perfil Profesional" })}</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">{t("topbar:mobile.nexum.profile.subtitle", { defaultValue: "CV, experiencia y verificación Mensa" })}</span>
                    </span>
                  </span>
                  <Chevron open={mobileExpandedPanel === "profile"} />
                </button>

                {mobileExpandedPanel === "profile" ? (
                  <div className="border-t border-[var(--line)] px-3 py-2">
                    <Link
                      href="/perfil"
                      onClick={closeMobileDrawer}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                        <TopBarNavIcon icon="doc" />
                      </span>
                      {t("topbar:mobile.nexum.editProfessionalProfile", { defaultValue: "Editar Perfil Profesional" })}
                    </Link>

                    <MembershipRequestActionRow
                      membershipCtaMode={membershipCtaMode}
                      isMembershipActionPending={isMembershipActionPending}
                      onRequestMembership={onRequestMembership}
                      onCancelMembership={onCancelMembership}
                    />
                  </div>
                ) : null}
              </article>

              <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_2px_color-mix(in_srgb,var(--navy-900)_9%,transparent)]">
                <button
                  type="button"
                  onClick={() => toggleMobilePanel("companies")}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[var(--brand-500)]">
                      <TopBarNavIcon icon="building" />
                    </span>
                    <span>
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">{t("topbar:mobile.nexum.companies.title", { defaultValue: "Empresas" })}</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">{t("topbar:mobile.nexum.companies.subtitle", { defaultValue: "Directorio de Sophium Empresarios" })}</span>
                    </span>
                  </span>
                  <Chevron open={mobileExpandedPanel === "companies"} />
                </button>

                {mobileExpandedPanel === "companies" ? (
                  <div className="border-t border-[var(--line)] px-3 py-2">
                    <Link
                      href="/directorio"
                      onClick={closeMobileDrawer}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                        <TopBarNavIcon icon="doc" />
                      </span>
                      {t("topbar:mobile.nexum.companies.explore", { defaultValue: "Explorar Sophium Empresarios" })}
                    </Link>
                    <Link
                      href="/my-enterprises"
                      onClick={closeMobileDrawer}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                        <TopBarNavIcon icon="building" />
                      </span>
                      {t("topbar:mobile.nexum.companies.manageMine", { defaultValue: "Gestionar mis empresas" })}
                    </Link>
                    <MembershipRequestActionRow
                      membershipCtaMode={membershipCtaMode}
                      isMembershipActionPending={isMembershipActionPending}
                      onRequestMembership={onRequestMembership}
                      onCancelMembership={onCancelMembership}
                    />
                    <div className="mt-2 border-t border-dashed border-[var(--line)] pt-2">
                      <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--text-soft)]">{t("topbar:mobile.sections.administration", { defaultValue: "ADMINISTRACIÓN" })}</p>
                      {hasCompaniesAdminAccess ? (
                        <Link
                          href="/admin/companies-admin"
                          onClick={closeMobileDrawer}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                            <TopBarNavIcon icon="settings" />
                          </span>
                          {t("topbar:mobile.nexum.companies.admin", { defaultValue: "Admin. Sophium Empresarios" })}
                        </Link>
                      ) : (
                        <DisabledMenuRow label={t("topbar:mobile.nexum.companies.admin", { defaultValue: "Admin. Sophium Empresarios" })} icon="settings" />
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <section>
            <h3 className="px-1 font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              {t("topbar:mobile.agora.title", { defaultValue: "Agora · tu espacio social" })}
            </h3>

            <div className="mt-2 space-y-2">
              <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_2px_color-mix(in_srgb,var(--navy-900)_9%,transparent)]">
                <button
                  type="button"
                  onClick={() => toggleMobilePanel("ateneo")}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] text-[var(--navy-900)]">
                      <TopBarNavIcon icon="groups" />
                    </span>
                    <span>
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">{t("topbar:mobile.agora.ateneo.title", { defaultValue: "Ateneo" })}</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">{t("topbar:mobile.agora.ateneo.subtitle", { defaultValue: "Grupos de conversación temática" })}</span>
                    </span>
                  </span>
                  <Chevron open={mobileExpandedPanel === "ateneo"} />
                </button>

                {mobileExpandedPanel === "ateneo" ? (
                  <div className="border-t border-[var(--line)] px-3 py-2">
                    <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.agora.adminGroups", { defaultValue: "GRUPOS QUE ADMINISTRÁS" })}</p>
                    {ateneoAdminGroups.length > 0 ? (
                      ateneoAdminGroups.slice(0, 2).map((group) => (
                        <AteneoGroupMenuLink
                          key={`mobile-ateneo-admin-${group.id}`}
                          group={group}
                          closeMobileDrawer={closeMobileDrawer}
                        />
                      ))
                    ) : (
                      <Link
                        href="/ateneo/groups?tab=admin"
                        onClick={closeMobileDrawer}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                          <TopBarNavIcon icon="cup" />
                        </span>
                        {t("topbar:mobile.agora.viewAdminGroups", { defaultValue: "Ver grupos que administrás" })}
                      </Link>
                    )}

                    <p className="mt-2 px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.agora.myGroups", { defaultValue: "TUS GRUPOS" })}</p>
                    {ateneoMineGroups.length > 0 ? (
                      ateneoMineGroups.slice(0, 3).map((group) => (
                        <AteneoGroupMenuLink
                          key={`mobile-ateneo-mine-${group.id}`}
                          group={group}
                          closeMobileDrawer={closeMobileDrawer}
                        />
                      ))
                    ) : (
                      <Link
                        href="/ateneo/groups?tab=mine"
                        onClick={closeMobileDrawer}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                          <TopBarNavIcon icon="groups" />
                        </span>
                        {t("topbar:mobile.agora.viewMyGroups", { defaultValue: "Ver mis grupos" })}
                      </Link>
                    )}

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.discover", { defaultValue: "DESCUBRIR" })}</p>
                    <Link href="/ateneo/groups?tab=discover" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="search" /></span>
                      {t("topbar:mobile.agora.exploreGroups", { defaultValue: "Explorar / Unirse a grupos" })}
                    </Link>
                    <Link href="/ateneo/create" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">+</span>
                      {t("topbar:mobile.agora.createGroup", { defaultValue: "Crear grupo nuevo" })}
                    </Link>

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.activity", { defaultValue: "ACTIVIDAD" })}</p>
                    <DisabledMenuRow label={t("topbar:mobile.agora.savedTopics", { defaultValue: "Mis Temas guardados" })} icon="doc" />
                    <DisabledMenuRow label={t("topbar:mobile.agora.weeklyRecognition", { defaultValue: "Reconocimiento semanal" })} icon="badge" />
                    <DisabledMenuRow label={t("topbar:mobile.agora.groupHealth", { defaultValue: "Salud del Grupo (admin)" })} icon="settings" />

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.about", { defaultValue: "ACERCA DE" })}</p>
                    <DisabledMenuRow label={t("topbar:mobile.agora.rules", { defaultValue: "Reglas de Ateneo" })} icon="badge" />
                    <DisabledMenuRow label={t("topbar:mobile.agora.privacyPolicy", { defaultValue: "Política de Privacidad" })} icon="doc" />
                    <DisabledMenuRow label={t("topbar:mobile.agora.userAgreement", { defaultValue: "Acuerdo de Usuarios" })} icon="doc" />
                  </div>
                ) : null}
              </article>

              <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 opacity-70 shadow-[0_1px_2px_color-mix(in_srgb,var(--navy-900)_9%,transparent)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] text-[var(--navy-900)]">
                      <TopBarNavIcon icon="puzzle" />
                    </span>
                    <span>
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">{t("topbar:mobile.agora.riddles.title", { defaultValue: "Acertijos" })}</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">{t("topbar:mobile.agora.riddles.subtitle", { defaultValue: "Retos y juegos de ingenio de la comunidad" })}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">{t("topbar:common.comingSoon", { defaultValue: "PRÓXIMAMENTE" })}</span>
                </div>
              </article>
            </div>
          </section>

          <section>
            <h3 className="px-1 font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              {t("topbar:mobile.sophium.title", { defaultValue: "Sophium" })}
            </h3>

            <article className="mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_2px_color-mix(in_srgb,var(--navy-900)_9%,transparent)]">
              <button
                type="button"
                onClick={() => toggleMobilePanel("account-admin")}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] text-[var(--brand-900)]">
                    <TopBarNavIcon icon="settings" />
                  </span>
                  <span>
                    <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">{t("topbar:mobile.sophium.accountAdmin.title", { defaultValue: "Cuenta y Administración" })}</span>
                    <span className="block text-scale-2 text-[var(--text-secondary)]">{t("topbar:mobile.sophium.accountAdmin.subtitle", { defaultValue: "Configuración, legales y herramientas de Admin" })}</span>
                  </span>
                </span>
                <Chevron open={mobileExpandedPanel === "account-admin"} />
              </button>

              {mobileExpandedPanel === "account-admin" ? (
                <div className="border-t border-[var(--line)] px-3 py-2">
                  <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.account", { defaultValue: "CUENTA" })}</p>
                  <Link href="/account/configuration" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="settings" /></span>
                    {t("topbar:profile.settings", { defaultValue: "Configuración" })}
                  </Link>
                  <Link href="/account/configuration/change-password" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="search" /></span>
                    {t("settings:rows.changePassword", { defaultValue: "Cambiar contraseña" })}
                  </Link>
                  <Link href="/account/configuration/blocked" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="ban" /></span>
                    {t("settings:rows.blocked", { defaultValue: "Bloqueados" })}
                  </Link>

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.legal", { defaultValue: "LEGALES" })}</p>
                  <DisabledMenuRow label={t("topbar:mobile.sophium.legalRules", { defaultValue: "Reglas de Ateneo y Sophium" })} icon="badge" />
                  <DisabledMenuRow label={t("topbar:mobile.sophium.legalTermsPrivacy", { defaultValue: "Términos y Política de Privacidad" })} icon="doc" />

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.administration", { defaultValue: "ADMINISTRACIÓN" })}</p>
                  {isAdmin ? (
                    <Link href="/admin" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="user" /></span>
                      {t("topbar:mobile.sophium.adminUsers", { defaultValue: "Usuarios Sophium" })}
                    </Link>
                  ) : (
                    <DisabledMenuRow label={t("topbar:mobile.sophium.adminUsers", { defaultValue: "Usuarios Sophium" })} icon="user" />
                  )}
                  {[
                    t("topbar:mobile.sophium.adminSophium", { defaultValue: "ABM de Sophium" }),
                    t("topbar:mobile.sophium.reportPost", { defaultValue: "Denuncias de Publicación" }),
                    t("topbar:mobile.sophium.reportProfile", { defaultValue: "Denuncias de Perfil" }),
                    t("topbar:mobile.sophium.messaging", { defaultValue: "Mensajería" }),
                    t("topbar:mobile.sophium.challengeBank", { defaultValue: "Banco de Desafíos y Premios" }),
                    t("topbar:mobile.sophium.riddleCalendar", { defaultValue: "Calendario de Acertijos" }),
                  ].map((label) => (
                    <DisabledMenuRow key={label} label={label} icon="doc" />
                  ))}

                  {hasCompaniesAdminAccess ? (
                    <Link href="/admin/companies-admin" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="building" /></span>
                      {t("topbar:mobile.sophium.adminCompanies", { defaultValue: "ABM Sophium Empresarios" })}
                    </Link>
                  ) : null}

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">{t("topbar:mobile.sections.help", { defaultValue: "AYUDA" })}</p>
                  <Link href="/account/contact" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="message" /></span>
                    {t("settings:rows.contact", { defaultValue: "Contactar a Sophium" })}
                  </Link>
                </div>
              ) : null}
            </article>
          </section>

          <button
            type="button"
            onClick={() => {
              void onLogout();
            }}
            className="mt-3 w-full rounded-2xl border border-[color:color-mix(in_srgb,var(--danger-500)_35%,transparent)] bg-[var(--surface)] px-4 py-3 text-left text-scale-3 font-semibold text-[var(--danger-500)]"
          >
            {t("topbar:profile.logout", { defaultValue: "Cerrar sesión" })}
          </button>
        </div>
      </aside>
    </>
  );
}
