"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listAteneoGroups, type AteneoGroup } from "@/lib/api/ateneo";

type AteneoExploreGroupsProps = {
  currentGroupId?: string;
  feedActive?: boolean;
};

type SectionKey = "admin" | "mine" | "discover";

const SECTION_LIMIT = 3;
const SECTION_EXPAND_LIMIT = 8;

const sectionConfig: Array<{ key: SectionKey; title: string }> = [
  { key: "admin", title: "Administrás" },
  { key: "mine", title: "Tus grupos" },
  { key: "discover", title: "Recomendados para vos" },
];

function GroupIcon({ icon }: { icon: AteneoGroup["icon"] }) {
  const common = "h-5 w-5";

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

function LeftRailGroupItem({
  group,
  currentGroupId,
}: {
  group: AteneoGroup;
  currentGroupId?: string;
}) {
  const isActive = currentGroupId === group.id;

  return (
    <Link
      href={`/ateneo/groups/${encodeURIComponent(group.id)}`}
      className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition ${
        isActive
          ? "border-[var(--brand-500)] bg-[color:color-mix(in_srgb,var(--brand-100)_42%,var(--surface))]"
          : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
        <GroupIcon icon={group.icon} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{group.name}</span>
        <span className="block truncate text-scale-2 text-[var(--text-secondary)]">
          {group.subtitle} <span className="mx-1">·</span> {group.activity}
        </span>
      </span>

      {group.isOfficial ? (
        <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--brand-500)]" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

function FeedShortcut({ active }: { active: boolean }) {
  return (
    <Link
      href="/ateneo"
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
        active
          ? "border-[var(--brand-500)] bg-[color:color-mix(in_srgb,var(--brand-100)_42%,var(--surface))]"
          : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <rect x="6" y="5" width="12" height="14" rx="2.5" />
          <path d="M9 9h6M9 13h6" />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-scale-3 font-semibold text-[var(--heading-primary)]">Feed</span>
        <span className="block text-scale-2 text-[var(--text-secondary)]">Mezclado, todos los grupos</span>
      </span>

      {active ? <span className="mt-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--brand-500)]" aria-hidden="true" /> : null}
    </Link>
  );
}

function SectionBlock({
  sectionKey,
  title,
  groups,
  currentGroupId,
  expanded,
  onToggleExpanded,
}: {
  sectionKey: SectionKey;
  title: string;
  groups: AteneoGroup[];
  currentGroupId?: string;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const visibleGroups = groups.slice(0, SECTION_LIMIT);
  const extraGroups = groups.slice(SECTION_LIMIT, expanded ? SECTION_EXPAND_LIMIT : SECTION_LIMIT);
  const hasMore = groups.length > SECTION_LIMIT;
  const hasOverflow = groups.length > SECTION_EXPAND_LIMIT;
  const actionLabel = !hasMore ? null : expanded ? (hasOverflow ? "Ver todos" : null) : "Ver más";
  const actionHref = `/ateneo/groups?tab=${sectionKey}`;

  return (
    <section className="space-y-2">
      <h3 className="px-1 text-scale-2 font-bold tracking-[0.08em] text-[var(--text-secondary)]">{title}</h3>

      <div className="space-y-2">
        {visibleGroups.map((group) => (
          <LeftRailGroupItem key={group.id} group={group} currentGroupId={currentGroupId} />
        ))}
        {expanded ? extraGroups.map((group) => <LeftRailGroupItem key={group.id} group={group} currentGroupId={currentGroupId} />) : null}
      </div>

      {actionLabel ? (
        <div className="pt-1">
          {expanded ? (
            <Link
              href={actionHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-scale-2 font-semibold text-[var(--brand-800)] transition hover:bg-[var(--surface-2)]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onToggleExpanded}
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-left text-scale-2 font-semibold text-[var(--brand-800)] transition hover:bg-[var(--surface-2)]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function DisabledBottomButton({ label }: { label: string }) {
  return (
    <div className="group relative">
      <button
        type="button"
        disabled
        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-left text-scale-2 font-semibold text-[var(--text-secondary)] opacity-70"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-secondary)]">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M6 4.5h12a1 1 0 0 1 1 1v14l-7-5-7 5v-14a1 1 0 0 1 1-1Z" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
      <span className="pointer-events-none absolute left-3 top-full z-10 mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-scale-1 font-medium text-[var(--text-secondary)] opacity-0 shadow-sm transition group-hover:opacity-100">
        Coming soon
      </span>
    </div>
  );
}

export function AteneoExploreGroups({ currentGroupId, feedActive = false }: AteneoExploreGroupsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    admin: false,
    mine: false,
    discover: false,
  });
  const [groupsBySection, setGroupsBySection] = useState<Record<SectionKey, AteneoGroup[]>>({
    admin: [],
    mine: [],
    discover: []
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [admin, mine, discover] = await Promise.all([
          listAteneoGroups("admin", 50),
          listAteneoGroups("mine", 50),
          listAteneoGroups("discover", 50)
        ]);

        if (cancelled) return;

        setGroupsBySection({
          admin: admin.data.groups,
          mine: mine.data.groups,
          discover: discover.data.groups
        });
      } catch {
        if (cancelled) return;
        setGroupsBySection({
          admin: [],
          mine: [],
          discover: []
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div className="flex w-full max-w-[330px] flex-col gap-4 px-4 py-4 lg:h-full lg:px-0 lg:pr-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_1px_color-mix(in_srgb,var(--navy-900)_7%,transparent)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-spectral)] text-[1.6rem] font-semibold leading-tight text-[var(--heading-primary)]">Ateneo</h2>

          <Link
            href="/ateneo/create"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-500)] px-4 py-2 text-scale-2 font-semibold text-[var(--navy-900)]"
          >
            + Grupo
          </Link>
        </div>

        <div className="mt-4 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-scale-3 text-[var(--text-secondary)]">
          <span className="block truncate">Buscar en Ateneo...</span>
        </div>

        <div className="mt-4 space-y-2">
          <FeedShortcut active={feedActive} />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_1px_color-mix(in_srgb,var(--navy-900)_7%,transparent)]">
        <section className="space-y-2">
          <h3 className="px-1 text-scale-2 font-bold tracking-[0.08em] text-[var(--text-secondary)]">Fijado</h3>
          <p className="px-1 text-scale-2 text-[var(--text-secondary)]">Coming soon</p>
        </section>

        {sectionConfig.map((section) => (
          <SectionBlock
            key={section.key}
            sectionKey={section.key}
            title={section.title}
            groups={groupsBySection[section.key]}
            currentGroupId={currentGroupId}
            expanded={expandedSections[section.key]}
            onToggleExpanded={() => toggleSection(section.key)}
          />
        ))}

        <div className="space-y-2 pt-1">
          <DisabledBottomButton label="Guardado" />
          <DisabledBottomButton label="Salud del grupo" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-left text-scale-2 font-semibold text-[var(--heading-primary)] transition hover:bg-[var(--surface-2)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[var(--brand-500)]">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <path d="M4.5 12h15" />
                <path d="M12 4.5v15" />
              </svg>
            </span>
            <span>Próximamente</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-left text-scale-2 font-semibold text-[var(--heading-primary)] transition hover:bg-[var(--surface-2)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[var(--brand-500)]">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <path d="M4.5 12h15" />
                <path d="M12 4.5v15" />
              </svg>
            </span>
            <span>Próximamente</span>
          </button>
        </div>
      </div>
    </div>
  );
}