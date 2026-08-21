"use client";

import { useEffect, useMemo, useState } from "react";
import { listVerifiedDirectory, type DirectoryEnterprise } from "@/lib/api/enterprise";
import { TopBar } from "../_components/TopBar";
import { navItems } from "../_lib/constants";

function initialsFromName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return "ME";
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function formatWebsite(value: string | null): string {
  if (!value) {
    return "Website";
  }

  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function DirectoryCard({ enterprise }: { enterprise: DirectoryEnterprise }) {
  const initials = initialsFromName(enterprise.name);
  const badge = "AR";
  const sector = enterprise.role || "Empresario/a";

  return (
    <article className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 shadow-[0_1px_0_rgba(16,24,40,0.02)] sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--navy-900)] text-[1.8rem] font-semibold text-[var(--brand-500)] shadow-inner shadow-[rgba(0,0,0,0.08)]">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mathesis-heading-primary text-scale-4 font-[family-name:var(--font-spectral)] font-semibold text-[var(--navy-900)]">
                {enterprise.name}
              </h2>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-scale-2 text-[var(--text-secondary)]">
              <span>{enterprise.founder ?? "Socio Mensa"}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-[0.67rem] font-semibold uppercase tracking-[0.08em] text-[var(--brand-700)]">
                {badge}
              </span>
            </div>

            <p className="mt-4 max-w-[980px] text-scale-3 leading-relaxed text-[var(--text-primary)]">
              {enterprise.description || "Sin descripción disponible."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center self-start">
          <span className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-2)] px-3 py-1 text-scale-1 font-semibold text-[var(--text-primary)]">
            {sector}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-5 text-scale-2 text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 21s-6-4.4-8.5-8.1C1.5 10.4 2.7 6 7 6a4 4 0 0 1 5 2.2A4 4 0 0 1 17 6c4.3 0 5.5 4.4 3.5 6.9C18 16.6 12 21 12 21Z" />
              </svg>
              {enterprise.location || "Ubicación"}
            </span>

            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M8 7.5a4 4 0 1 1 8 0v1a4 4 0 1 1-8 0v-1Z" />
                <path d="M5 19a7 7 0 0 1 14 0" />
              </svg>
              {enterprise.role || "Empresario/a"}
            </span>

            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9.5 5.5h8.5a1 1 0 0 1 1 1v10.9a1 1 0 0 1-1 1H9.5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
                <path d="M6 7.5H4.5a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1H15a1 1 0 0 0 1-1v-1.5" />
              </svg>
              {formatWebsite(enterprise.website)}
            </span>
          </div>

          <button
            type="button"
            aria-label={`Ver perfil completo de ${enterprise.name}`}
            className="inline-flex items-center gap-2 self-end rounded-full border border-transparent px-2 py-1 text-scale-2 font-semibold text-[var(--brand-700)] transition hover:text-[var(--brand-800)]"
          >
            <span>Ver perfil completo</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DirectorioPage() {
  const [enterprises, setEnterprises] = useState<DirectoryEnterprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDirectory = async () => {
      try {
        const response = await listVerifiedDirectory(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setEnterprises(response);
        setError(null);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        setEnterprises([]);
        setError("No pudimos cargar el directorio en este momento.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDirectory();

    return () => {
      controller.abort();
    };
  }, []);

  const emptyState = useMemo(
    () => !isLoading && enterprises.length === 0 && !error,
    [enterprises.length, error, isLoading]
  );

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 lg:px-10">
        <header className="mb-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1.5 text-scale-1 font-semibold uppercase tracking-[0.12em] text-[var(--navy-900)] shadow-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-sm bg-[var(--brand-500)]" aria-hidden="true" />
            Mensa Empresarios
          </div>

          <h1 className="mathesis-heading-primary text-scale-5 font-[family-name:var(--font-spectral)] font-semibold text-[var(--navy-900)]">
            Empresas de la comunidad
          </h1>
          <p className="mt-3 text-scale-3 text-[var(--text-secondary)]">
            Fundadas o lideradas por socios Mensa. Verificadas.
          </p>
        </header>

        <section className="mb-7 rounded-[1.5rem] border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--brand-200)_45%,var(--surface))] px-5 py-4 shadow-[0_1px_0_rgba(16,24,40,0.02)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="mathesis-heading-primary text-scale-4 font-[family-name:var(--font-spectral)] font-semibold text-[var(--navy-900)]">
                ¿Sos empresario/a Mensa?
              </h2>
              <p className="mt-2 text-scale-3 text-[var(--text-primary)]">
                Mensa Empresarios es nuevo — te contamos de qué se trata. Podés también solicitarlo desde tu perfil.
              </p>
            </div>

            <button
              type="button"
              title="Próximamente"
              disabled
              aria-label="Solicitar membresía Mensa Empresarios. Próximamente."
              className="inline-flex items-center justify-between gap-3 rounded-xl border border-[var(--line-strong)] bg-[var(--brand-500)] px-5 py-3 text-scale-2 font-semibold text-[var(--navy-900)] opacity-80 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>Solicitar membresía Empresarios</span>
              <span aria-hidden="true" className="text-lg">×</span>
            </button>
          </div>
        </section>

        <div className="space-y-5">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 text-scale-2 text-[var(--text-secondary)]">
              Cargando empresas...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 text-scale-2 text-[var(--text-secondary)]">
              {error}
            </div>
          ) : null}

          {!isLoading && emptyState ? (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 text-scale-2 text-[var(--text-secondary)]">
              Todavía no hay empresas verificadas en el directorio.
            </div>
          ) : null}

          {!isLoading && !error && enterprises.map((enterprise) => (
            <DirectoryCard key={enterprise.id} enterprise={enterprise} />
          ))}
        </div>
      </main>
    </div>
  );
}
