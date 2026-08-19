"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";
import { listAteneoGroups, type AteneoGroup, type AteneoTabKey } from "@/lib/api/ateneo";

const ateneoTabs: Array<{ key: AteneoTabKey; label: string }> = [
  { key: "mine", label: "Tus grupos" },
  { key: "discover", label: "Descubrir" },
  { key: "admin", label: "Grupos que administrás" }
];

function resolveTab(searchTab: string | null): AteneoTabKey {
  if (searchTab === "admin" || searchTab === "discover" || searchTab === "mine") {
    return searchTab;
  }

  return "mine";
}

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
  const isOpenable = true;

  return (
    <article
      role={isOpenable ? "button" : undefined}
      tabIndex={isOpenable ? 0 : undefined}
      onClick={() => {
        if (!isOpenable) return;
        onOpenGroup(group.id);
      }}
      onKeyDown={(event) => {
        if (!isOpenable) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpenGroup(group.id);
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

          {group.isOfficial ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-3 py-1 text-scale-2 font-semibold text-[var(--brand-900)]">
                Oficial
              </span>
            </div>
          ) : null}
        </div>

        {group.isMember ? (
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

        {!group.isMember ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenGroup(group.id);
            }}
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--brand-500)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-800)] transition hover:bg-[color:color-mix(in_srgb,var(--brand-100)_65%,var(--surface))]"
          >
            Unirse
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SearchAndHeader({ activeTab, onTabChange, searchText, onSearchTextChange }: {
  activeTab: AteneoTabKey;
  onTabChange: (tab: AteneoTabKey) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mt-1 font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-tight text-[var(--heading-primary)] sm:mt-0 sm:text-[2.5rem]">
            Explorar Grupos
          </h1>
          <p className="text-scale-3 text-[var(--text-secondary)]">Agora › Ateneo › Explorar</p>
        </div>

        <Link href="/ateneo/create" className="hidden rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95 sm:inline-flex">
          + Crear grupo
        </Link>
      </header>

      <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-[0_1px_1px_color-mix(in_srgb,var(--navy-900)_7%,transparent)] sm:max-w-[520px]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--text-soft)]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="search"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Buscar grupos..."
          className="w-full bg-transparent text-scale-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-soft)]"
        />
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ateneoTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
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
    </div>
  );
}

export function AteneoGroupsExplorer() {
  const [searchText, setSearchText] = useState("");
  const [groups, setGroups] = useState<AteneoGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = resolveTab(searchParams.get("tab"));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await listAteneoGroups(activeTab, 50);
        if (cancelled) return;
        setGroups(response.data.groups);
      } catch {
        if (cancelled) return;
        setGroups([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const filteredGroups = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return groups;

    return groups.filter((group) => {
      const haystack = `${group.name} ${group.subtitle} ${group.activity}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [groups, searchText]);

  const onAction = () => {
    toast.info("Coming soon");
  };

  const goToGroup = (groupId: string) => {
    router.push(`/ateneo/groups/${encodeURIComponent(groupId)}`);
  };

  const goToTab = (tab: AteneoTabKey) => {
    router.push(`/ateneo/groups?tab=${tab}`);
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <TopBar navItems={navItems} />
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-5 sm:px-8 sm:pb-8 sm:pt-8">
        <SearchAndHeader activeTab={activeTab} onTabChange={goToTab} searchText={searchText} onSearchTextChange={setSearchText} />

        <section className="mt-5 space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-7 text-center text-scale-3 text-[var(--text-secondary)]">
              Cargando grupos...
            </div>
          ) : null}

          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} onAction={onAction} onOpenGroup={goToGroup} />
          ))}

          {!isLoading && filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-7 text-center text-scale-3 text-[var(--text-secondary)]">
              No encontramos grupos con ese criterio.
            </div>
          ) : null}
        </section>

        <button
          type="button"
          onClick={() => toast.info("Coming soon")}
          className="fixed bottom-24 right-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-500)] text-[2rem] mathesis-on-brand shadow-[0_10px_28px_color-mix(in_srgb,var(--brand-500)_45%,transparent)] transition hover:brightness-95 sm:hidden"
          aria-label="Crear grupo"
        >
          +
        </button>
      </div>
    </div>
  );
}