import Link from "next/link";
import type { AteneoGroup } from "../_lib/mock-data";

export type AteneoGroupTopic = {
  id: string;
  authorInitial: string;
  groupLabel: string;
  authorName: string;
  timeLabel: string;
  title: string;
  description: string;
  tone: string;
  reactions: number;
  comments: number;
};

type AteneoGroupFeedProps = {
  group: AteneoGroup;
  groupId: string;
  topics: AteneoGroupTopic[];
};

function GroupHeaderIcon() {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="8.5" cy="9" r="2.2" />
        <circle cx="15.5" cy="10.5" r="2.2" />
        <path d="M4.5 18.5a4 4 0 0 1 8 0" />
        <path d="M11.5 18.5a4 4 0 0 1 8 0" />
      </svg>
    </div>
  );
}

export function AteneoGroupFeed({ group, groupId, topics }: AteneoGroupFeedProps) {
  return (
    <>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <GroupHeaderIcon />
            <div>
              <h1 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
                {group.name}
              </h1>
              <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
                {group.subtitle} <span className="mx-1">·</span> {group.activity}
              </p>
            </div>
          </div>

          <Link
            href={`/ateneo/groups/${encodeURIComponent(groupId)}/new-topic`}
            className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95"
          >
            + Nuevo tema
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="text-scale-4 font-semibold text-[var(--heading-primary)]">Reglas del grupo</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-scale-3 text-[var(--text-primary)]">
            {group.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
          Temas más populares
        </h2>

        <div className="mt-3 space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topic.id)}`}
              className="block rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)]"
            >
              <article>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-sm font-semibold text-[var(--surface)]">
                    {topic.authorInitial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-scale-2 text-[var(--text-secondary)]">
                      {topic.groupLabel} <span className="mx-1">·</span> <span className="font-semibold text-[var(--text-primary)]">{topic.authorName}</span> <span className="mx-1">·</span> {topic.timeLabel}
                    </p>
                    <h3 className="mt-1 text-[1.32rem] font-semibold leading-tight text-[var(--heading-primary)]">
                      {topic.title}
                    </h3>
                    <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">{topic.description}</p>

                    <div className="mt-3 flex items-center gap-3 text-scale-2 text-[var(--text-secondary)]">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 font-semibold text-[var(--brand-800)]">
                        {topic.tone}
                      </span>
                      <span>○ {topic.reactions}</span>
                      <span>💬 {topic.comments}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
