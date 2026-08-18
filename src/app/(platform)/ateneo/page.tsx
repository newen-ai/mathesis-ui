"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { navItems } from "../_lib/constants";
import { TopBar } from "../_components/TopBar";
import {
  ateneoGroupsByTab,
  ateneoTabs,
  type AteneoGroup,
  type AteneoTabKey,
} from "./_lib/mock-data";

function GroupIcon({ icon }: { icon: AteneoGroup["icon"] }) {
  const common = "h-6 w-6";

  if (icon === "cafe") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4 7h11v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7Z" />
        <path d="M15 9h2.5a2 2 0 0 1 0 4H15" />
        <path d="M7 4.6v1.8M10 4.6v1.8" />
      </svg>
    );
  }

  if (icon === "gift") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M12 7v13M4 11h16" />
      </svg>
    );
  }

  if (icon === "community") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="8.5" cy="9" r="2.2" />
        <circle cx="15.5" cy="10.5" r="2.2" />
        <path d="M4.5 18.5a4 4 0 0 1 8 0" />
        <path d="M11.5 18.5a4 4 0 0 1 8 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="m4 9 8-4 8 4-8 4-8-4Z" />
      <path d="M6.8 12.8 12 15.4l5.2-2.6" />
    </svg>
  );
}

function GroupCard({
  group,
  onAction,
  onOpenGroup,
}: {
  group: AteneoGroup;
  onAction: () => void;
  onOpenGroup: (groupId: string) => void;
}) {
  const isOpenable = group.isMember;

  const openGroup = () => {
    if (!isOpenable) return;
    onOpenGroup(group.id);
  };

  return (
    <article
      role={isOpenable ? "button" : undefined}
      tabIndex={isOpenable ? 0 : undefined}
      onClick={openGroup}
      onKeyDown={(event) => {
        if (!isOpenable) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openGroup();
      }}
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-[0_1px_1px_color-mix(in_srgb,var(--navy-900)_7%,transparent)] sm:px-5 ${
        isOpenable ? "cursor-pointer transition hover:border-[var(--line-strong)]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
          <GroupIcon icon={group.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-scale-4 font-semibold leading-tight text-[var(--heading-primary)] sm:text-scale-5">{group.name}</h3>
          <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
            {group.subtitle} <span className="mx-1">·</span> {group.activity}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {group.badges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-3 py-1 text-scale-2 font-semibold text-[var(--brand-900)]"
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {group.action === "menu" ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            aria-label={`Opciones de ${group.name}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="6" cy="12" r="1.3" />
              <circle cx="12" cy="12" r="1.3" />
              <circle cx="18" cy="12" r="1.3" />
            </svg>
          </button>
        ) : null}

        {group.action === "settings" ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            aria-label={`Configurar ${group.name}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="12" cy="12" r="2.8" />
              <path d="M12 4.2v2M12 17.8v2M19.8 12h-2M6.2 12h-2M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4M17.5 17.5l-1.4-1.4M7.9 7.9 6.5 6.5" />
            </svg>
          </button>
        ) : null}

        {group.action === "join" ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--brand-500)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-800)] transition hover:bg-[color:color-mix(in_srgb,var(--brand-100)_65%,var(--surface))]"
          >
            {group.actionLabel ?? "Unirse"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MobileBottomNav({ onCreate }: { onCreate: () => void }) {
  return (
    <nav className="mt-7 border-t border-[var(--line)] bg-[var(--surface)] px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4 sm:hidden">
      <ul className="grid grid-cols-5 items-end gap-2 text-center text-[0.78rem] font-medium text-[var(--text-secondary)]">
        <li>
          <Link href="/" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="5" y="4.5" width="14" height="15" rx="2" />
                <path d="M12 4.5v15M5 9.5h14" />
              </svg>
            </span>
            Nexum
          </Link>
        </li>
        <li className="text-[var(--brand-500)]">
          <Link href="/ateneo" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--brand-500)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="8" cy="9" r="2.5" />
                <circle cx="16" cy="9" r="2.5" />
                <path d="M4.5 18a4.5 4.5 0 0 1 7 0M12.5 18a4.5 4.5 0 0 1 7 0" />
              </svg>
            </span>
            Agora
          </Link>
        </li>
        <li>
          <button type="button" onClick={onCreate} className="mx-auto block text-[var(--text-secondary)]">
            <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-500)] text-[var(--navy-900)] shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Crear
          </button>
        </li>
        <li>
          <Link href="/mensajes" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
              </svg>
            </span>
            Mensajes
          </Link>
        </li>
        <li>
          <Link href="/perfil" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="3.1" />
                <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            Perfil
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default function AteneoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AteneoTabKey>("mine");
  const [searchText, setSearchText] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    const groups = ateneoGroupsByTab[activeTab];
    const query = searchText.trim().toLowerCase();

    if (!query) return groups;

    return groups.filter((group) => {
      const haystack = `${group.name} ${group.subtitle} ${group.activity}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTab, searchText]);

  const showComingSoonToast = () => {
    toast.info("Coming soon");
  };

  const goToCreateGroup = () => {
    router.push("/ateneo/create");
  };

  const goToGroup = (groupId: string) => {
    router.push(`/ateneo/groups/${encodeURIComponent(groupId)}`);
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <TopBar navItems={navItems} />
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-5 sm:px-8 sm:pb-8 sm:pt-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--navy-900)] transition hover:bg-[var(--surface-2)]"
                  aria-label="Volver"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m14.5 5.5-6 6 6 6" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((current) => !current)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--navy-900)] transition hover:bg-[var(--surface-2)]"
                  aria-label="Buscar grupos"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <circle cx="11" cy="11" r="6" />
                    <path d="m16 16 4 4" />
                  </svg>
                </button>
              </div>
            </div>

            <h1 className="mt-1 font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-tight text-[var(--heading-primary)] sm:mt-0 sm:text-[2.5rem]">
              Explorar Grupos
            </h1>
            <p className="text-scale-3 text-[var(--text-secondary)]">Agora › Ateneo › Explorar</p>
          </div>

          <button
            type="button"
            onClick={goToCreateGroup}
            className="hidden rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95 sm:inline-flex"
          >
            + Crear grupo
          </button>
        </header>

        <div className={`mt-5 ${mobileSearchOpen ? "block" : "hidden"} sm:block`}>
          <label htmlFor="ateneo-group-search" className="sr-only">
            Buscar grupos
          </label>
          <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-[0_1px_1px_color-mix(in_srgb,var(--navy-900)_7%,transparent)] sm:max-w-[520px]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--text-soft)]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              id="ateneo-group-search"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar grupos..."
              className="w-full bg-transparent text-scale-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)]"
            />
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ateneoTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl border px-4 py-2 text-left transition ${
                    isActive
                      ? "border-[var(--brand-500)] bg-[color:color-mix(in_srgb,var(--brand-100)_72%,var(--surface))] text-[var(--brand-900)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--navy-900)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <p className="text-scale-3 font-semibold">{tab.label}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 space-y-3 sm:space-y-4">
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} onAction={showComingSoonToast} onOpenGroup={goToGroup} />
          ))}

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-7 text-center text-scale-3 text-[var(--text-secondary)]">
              No encontramos grupos con ese criterio.
            </div>
          ) : null}
        </section>

        <button
          type="button"
          onClick={goToCreateGroup}
          className="fixed bottom-24 right-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-500)] text-[2rem] mathesis-on-brand shadow-[0_10px_28px_color-mix(in_srgb,var(--brand-500)_45%,transparent)] transition hover:brightness-95 sm:hidden"
          aria-label="Crear grupo"
        >
          +
        </button>

        <MobileBottomNav onCreate={goToCreateGroup} />
      </div>
    </div>
  );
}
