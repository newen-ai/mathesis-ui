import Link from "next/link";
import type { RefObject } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
  hasCompaniesAdminAccess: boolean;
  isAdmin: boolean;
  onLogout: () => Promise<void>;
};

function DisabledMenuRow({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-soft)] opacity-80">
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-soft)]">
          <TopBarNavIcon icon={icon} />
        </span>
        {label}
      </span>
      <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">
        PRÓXIMAMENTE
      </span>
    </div>
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
  hasCompaniesAdminAccess,
  isAdmin,
  onLogout,
}: TopBarMobileProps) {
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
        aria-label="Cerrar menú"
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
                label="Foto de perfil"
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                initialsClassName="text-2xl font-semibold text-[var(--brand-500)]"
              />
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-spectral)] text-scale-5 font-semibold leading-tight mathesis-heading-primary">
                  {isLoadingUserName ? "Cargando..." : userName || "Mi perfil"}
                </p>
                <p className="text-scale-2 text-[var(--text-secondary)]">
                  {userIdentityLine || "CEO · Mathesis & Newen Solutions"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobileDrawer}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              aria-label="Cerrar menú"
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
              Nexum · tu red profesional
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
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">Tu Perfil Profesional</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">CV, experiencia y verificación Mensa</span>
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
                      Editar Perfil Profesional
                    </Link>

                    {membershipCtaMode !== "go" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void onRequestMembership();
                        }}
                        disabled={membershipCtaMode !== "request" || isMembershipActionPending}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-scale-3 ${
                          membershipCtaMode === "request"
                            ? "text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                            : "cursor-default text-[var(--text-secondary)]"
                        }`}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                          <TopBarNavIcon icon="badge" />
                        </span>
                        {isMembershipActionPending
                          ? "Enviando solicitud..."
                          : membershipCtaMode === "requested"
                            ? "Solicitud de membresía enviada"
                            : "Solicitar Membresía"}
                      </button>
                    ) : null}
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
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">Empresas</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">Directorio de Mensa Empresarios</span>
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
                      Explorar Mensa Empresarios
                    </Link>
                    <Link
                      href="/my-enterprises"
                      onClick={closeMobileDrawer}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                        <TopBarNavIcon icon="building" />
                      </span>
                      Gestionar mis empresas
                    </Link>
                    <DisabledMenuRow label="Solicitar Mensa Empresarios" icon="badge" />
                    <div className="mt-2 border-t border-dashed border-[var(--line)] pt-2">
                      <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--text-soft)]">ADMINISTRACIÓN</p>
                      {hasCompaniesAdminAccess ? (
                        <Link
                          href="/admin/companies-admin"
                          onClick={closeMobileDrawer}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
                            <TopBarNavIcon icon="settings" />
                          </span>
                          Admin. Mensa Empresarios
                        </Link>
                      ) : (
                        <DisabledMenuRow label="Admin. Mensa Empresarios" icon="settings" />
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <section>
            <h3 className="px-1 font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              Agora · tu espacio social
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
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">Ateneo</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">Grupos de conversación temática</span>
                    </span>
                  </span>
                  <Chevron open={mobileExpandedPanel === "ateneo"} />
                </button>

                {mobileExpandedPanel === "ateneo" ? (
                  <div className="border-t border-[var(--line)] px-3 py-2">
                    <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">GRUPOS QUE ADMINISTRÁS</p>
                    <Link href="/ateneo/groups?tab=admin" onClick={closeMobileDrawer} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="cup" /></span>
                      <span>
                        <span className="block text-scale-3 text-[var(--text-primary)]">Café Mathesis</span>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--brand-100)_75%,var(--surface))] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--brand-900)]">Oficial</span>
                        <span className="ml-1 mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--brand-800)]">∫ Mensa AR</span>
                      </span>
                    </Link>

                    <p className="mt-2 px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">TUS GRUPOS</p>
                    <Link href="/ateneo/groups?tab=mine" onClick={closeMobileDrawer} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="groups" /></span>
                      <span>
                        <span className="block text-scale-3 text-[var(--text-primary)]">Comunicación Mensa Argentina</span>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--brand-100)_75%,var(--surface))] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--brand-900)]">Oficial</span>
                        <span className="ml-1 mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--brand-800)]">∫ Mensa AR</span>
                      </span>
                    </Link>
                    <Link href="/ateneo/groups?tab=mine" onClick={closeMobileDrawer} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="groups" /></span>
                      <span className="block text-scale-3 text-[var(--text-primary)]">Ajedrez y Estrategia</span>
                    </Link>

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">DESCUBRIR</p>
                    <Link href="/ateneo/groups?tab=discover" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="search" /></span>
                      Explorar / Unirse a grupos
                    </Link>
                    <Link href="/ateneo/create" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">+</span>
                      Crear grupo nuevo
                    </Link>

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">ACTIVIDAD</p>
                    <DisabledMenuRow label="Mis Temas guardados" icon="doc" />
                    <DisabledMenuRow label="Reconocimiento semanal" icon="badge" />
                    <DisabledMenuRow label="Salud del Grupo (admin)" icon="settings" />

                    <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">ACERCA DE</p>
                    <DisabledMenuRow label="Reglas de Ateneo" icon="badge" />
                    <DisabledMenuRow label="Política de Privacidad" icon="doc" />
                    <DisabledMenuRow label="Acuerdo de Usuarios" icon="doc" />
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
                      <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">Acertijos</span>
                      <span className="block text-scale-2 text-[var(--text-secondary)]">Retos y juegos de ingenio de la comunidad</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-[var(--brand-700)]">PRÓXIMAMENTE</span>
                </div>
              </article>
            </div>
          </section>

          <section>
            <h3 className="px-1 font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              Mathesis
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
                    <span className="block text-scale-3 font-semibold text-[var(--text-primary)]">Cuenta y Administración</span>
                    <span className="block text-scale-2 text-[var(--text-secondary)]">Configuración, legales y herramientas de Admin</span>
                  </span>
                </span>
                <Chevron open={mobileExpandedPanel === "account-admin"} />
              </button>

              {mobileExpandedPanel === "account-admin" ? (
                <div className="border-t border-[var(--line)] px-3 py-2">
                  <p className="px-2 pb-1 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">CUENTA</p>
                  <Link href="/account/configuration" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="settings" /></span>
                    Configuración
                  </Link>
                  <Link href="/account/configuration/change-password" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="search" /></span>
                    Cambiar contraseña
                  </Link>
                  <Link href="/account/configuration/blocked" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="ban" /></span>
                    Bloqueados
                  </Link>

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">LEGALES</p>
                  <DisabledMenuRow label="Reglas de Ateneo y Mathesis" icon="badge" />
                  <DisabledMenuRow label="Términos y Política de Privacidad" icon="doc" />

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">ADMINISTRACIÓN</p>
                  {isAdmin ? (
                    <Link href="/admin" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="user" /></span>
                      Usuarios Mathesis
                    </Link>
                  ) : (
                    <DisabledMenuRow label="Usuarios Mathesis" icon="user" />
                  )}
                  {[
                    "ABM de Mathesis",
                    "Denuncias de Publicación",
                    "Denuncias de Perfil",
                    "Mensajería",
                    "Banco de Desafíos y Premios",
                    "Calendario de Acertijos",
                  ].map((label) => (
                    <DisabledMenuRow key={label} label={label} icon="doc" />
                  ))}

                  {hasCompaniesAdminAccess ? (
                    <Link href="/admin/companies-admin" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="building" /></span>
                      ABM Mensa Empresarios
                    </Link>
                  ) : null}

                  <p className="mt-2 border-t border-dashed border-[var(--line)] px-2 pb-1 pt-2 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--brand-700)]">AYUDA</p>
                  <Link href="/account/contact" onClick={closeMobileDrawer} className="flex items-center gap-3 rounded-xl px-2 py-2 text-scale-3 text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"><TopBarNavIcon icon="message" /></span>
                    Contactar a Mathesis
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
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
