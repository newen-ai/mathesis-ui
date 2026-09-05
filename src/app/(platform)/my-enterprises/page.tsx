"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteEnterprise, listMyEnterprises, type Enterprise as ApiEnterprise } from "@/lib/api/enterprise";
import { getTwoInitials } from "@/lib/utils/name";
import { TopBar } from "../_components/TopBar";
import { navItems } from "../_lib/constants";

type Enterprise = {
  id: string;
  name: string;
  role: string;
  website: string | null;
  description: string;
};

function mapEnterpriseFromApi(enterprise: ApiEnterprise): Enterprise {
  return {
    id: enterprise.id,
    name: enterprise.name,
    role: enterprise.role,
    website: enterprise.website,
    description: enterprise.description?.trim() || "Sin descripción cargada."
  };
}

function EnterpriseCard({
  enterprise,
  onDelete
}: {
  enterprise: Enterprise;
  onDelete: (enterpriseId: string) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar la empresa “${enterprise.name}”?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(enterprise.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-[0_1px_0_color-mix(in_srgb,var(--navy-900)_8%,transparent)] sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--navy-900)] text-xl font-semibold text-[var(--brand-500)]">
            {getTwoInitials({ fullName: enterprise.name, fallback: "ME" })}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
                {enterprise.name}
              </h2>
            </div>
            <p className="text-scale-3 mt-1.5 text-[var(--text-secondary)]">{enterprise.role}</p>
            <p className="text-scale-3 mt-1.5 text-[var(--text-secondary)]">
              {enterprise.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
          <button
            type="button"
            onClick={() => router.push(`/my-enterprises/edit?id=${enterprise.id}`)}
            className="text-scale-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 font-semibold text-[var(--text-primary)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Z" />
              <path d="M12.8 7 17 11.2" />
            </svg>
            Editar
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            aria-label={`Eliminar ${enterprise.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--danger-500)_40%,var(--line))] text-[color:color-mix(in_srgb,var(--danger-500)_82%,var(--text-primary))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M6.5 7.5h11" />
              <path d="m9.5 7.5.5-2h4l.5 2" />
              <rect x="8" y="7.5" width="8" height="11" rx="1.4" />
              <path d="M10.5 10.5v5M13.5 10.5v5" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyEnterprisesPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(true);

  const handleDelete = async (enterpriseId: string) => {
    const response = await deleteEnterprise(enterpriseId);

    if (!response.success) {
      window.alert(response.message || "No pudimos eliminar la empresa.");
      return;
    }

    setEnterprises((current) => current.filter((enterprise) => enterprise.id !== enterpriseId));
  };

  useEffect(() => {
    const controller = new AbortController();

    void listMyEnterprises(controller.signal)
      .then((response) => {
        setEnterprises(response.map(mapEnterpriseFromApi));
      })
      .catch(() => {
        setEnterprises([]);
      })
      .finally(() => {
        setIsLoadingEnterprises(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7 lg:px-10 lg:py-8">
        <section className="min-w-0 border-r-0 lg:border-r lg:border-[var(--line)] lg:pr-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-scale-5 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
                Mis empresas
              </h1>
              <p className="text-scale-3 mt-4 max-w-[890px] text-[var(--text-secondary)]">
                Estas son las empresas que gestionás en Mathesis. Solo el Admin puede editar o eliminar una ficha. El Admin es quien la generó en Mathesis.
              </p>
            </div>

            <Link
              href="/my-enterprises/create"
              className="text-scale-2 inline-flex items-center justify-center rounded-xl border border-[var(--brand-500)] px-4 py-2 font-semibold text-[var(--brand-700)]"
            >
              + Crear nueva empresa
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {isLoadingEnterprises ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[var(--text-secondary)] sm:px-5">
                Cargando empresas...
              </div>
            ) : null}

            {!isLoadingEnterprises && enterprises.length === 0 ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[var(--text-secondary)] sm:px-5">
                Todavía no tenés empresas creadas.
              </div>
            ) : null}

            {!isLoadingEnterprises
              ? enterprises.map((enterprise) => (
                  <EnterpriseCard
                    key={enterprise.id}
                    enterprise={enterprise}
                    onDelete={handleDelete}
                  />
                ))
              : null}
          </div>
        </section>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              Directorio de Mensa Empresarios
            </h2>
            <p className="text-scale-3 mt-4 text-[var(--text-primary)]">
              Tus empresas aprobadas ya son visibles ahí para el resto de la comunidad.
            </p>
            <button
              type="button"
              className="text-scale-2 mathesis-on-brand mt-4 inline-flex items-center rounded-full bg-[var(--brand-500)] px-5 py-2 font-semibold"
            >
              Ver directorio →
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              ¿Quién puede editar?
            </h2>
            <p className="text-scale-3 mt-4 text-[var(--text-primary)]">
              Solo el Admin que generó la ficha en Mathesis. Los demás cofundadores la ven pero no la editan.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}