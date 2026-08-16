"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listMyEnterprises, updateEnterprise } from "@/lib/api/enterprise";
import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";

type EnterpriseForm = {
  companyName: string;
  role: string;
  website: string;
  description: string;
};

type EnterpriseErrors = {
  companyName?: string;
  role?: string;
};

const REQUIRED_FIELD_MESSAGE = "Este campo es obligatorio.";

export default function EditEnterprisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enterpriseId = searchParams.get("id") ?? "";

  const [form, setForm] = useState<EnterpriseForm>({
    companyName: "",
    role: "",
    website: "",
    description: "",
  });
  const [errors, setErrors] = useState<EnterpriseErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!enterpriseId) {
      router.replace("/my-enterprises");
      return;
    }

    const loadEnterprise = async () => {
      try {
        const enterprises = await listMyEnterprises();
        const selected = enterprises.find((enterprise) => enterprise.id === enterpriseId);

        if (!selected) {
          router.replace("/my-enterprises");
          return;
        }

        setForm({
          companyName: selected.name,
          role: selected.role,
          website: selected.website ?? "",
          description: selected.description ?? "",
        });
      } catch {
        setSubmitError("No pudimos cargar la empresa para editar.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadEnterprise();
  }, [enterpriseId, router]);

  const onFieldChange = (field: keyof EnterpriseForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    if ((field === "companyName" || field === "role") && value.trim().length > 0) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!enterpriseId) {
      router.replace("/my-enterprises");
      return;
    }

    const nextErrors: EnterpriseErrors = {};

    if (form.companyName.trim().length === 0) {
      nextErrors.companyName = REQUIRED_FIELD_MESSAGE;
    }

    if (form.role.trim().length === 0) {
      nextErrors.role = REQUIRED_FIELD_MESSAGE;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await updateEnterprise(enterpriseId, {
        companyName: form.companyName.trim(),
        role: form.role.trim(),
        website: form.website.trim() || undefined,
        description: form.description.trim() || undefined,
      });

      if (!response.success) {
        setSubmitError(response.message || "No pudimos guardar los cambios.");
        return;
      }

      router.push("/my-enterprises");
    } catch {
      setSubmitError("No pudimos conectar con el servicio de empresas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7 lg:px-10 lg:py-8">
        <section className="min-w-0 border-r-0 lg:border-r lg:border-[var(--line)] lg:pr-7">
          <h1 className="text-scale-5 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
            Editar empresa
          </h1>

          {isLoading ? (
            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[var(--text-secondary)]">
              Cargando empresa...
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
              <label className="block">
                <span className="text-scale-3 mathesis-heading-primary font-semibold">
                  Nombre de la empresa <span className="text-[var(--danger-500)]">*</span>
                </span>
                <input
                  value={form.companyName}
                  onChange={(event) => onFieldChange("companyName", event.target.value)}
                  type="text"
                  className={`text-scale-3 mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)] ${errors.companyName ? "border-[var(--danger-500)]" : "border-[var(--line)]"}`}
                />
                {errors.companyName ? (
                  <p className="text-scale-2 mt-1 text-[var(--danger-500)]">{errors.companyName}</p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-scale-3 mathesis-heading-primary font-semibold">
                  Tu rol <span className="text-[var(--danger-500)]">*</span>
                </span>
                <input
                  value={form.role}
                  onChange={(event) => onFieldChange("role", event.target.value)}
                  type="text"
                  className={`text-scale-3 mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)] ${errors.role ? "border-[var(--danger-500)]" : "border-[var(--line)]"}`}
                />
                {errors.role ? (
                  <p className="text-scale-2 mt-1 text-[var(--danger-500)]">{errors.role}</p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-scale-3 mathesis-heading-primary font-semibold">Sitio web</span>
                <input
                  value={form.website}
                  onChange={(event) => onFieldChange("website", event.target.value)}
                  type="text"
                  className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
                />
              </label>

              <label className="block">
                <span className="text-scale-3 mathesis-heading-primary font-semibold">Descripción breve</span>
                <textarea
                  value={form.description}
                  onChange={(event) => onFieldChange("description", event.target.value)}
                  rows={3}
                  className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="text-scale-4 mathesis-on-brand mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>

              {submitError ? (
                <p className="text-scale-2 text-[var(--danger-500)]">{submitError}</p>
              ) : null}

              <div className="pt-1 text-center">
                <Link href="/my-enterprises" className="text-scale-4 mathesis-link-accent font-semibold transition">
                  ← Volver a Mis empresas
                </Link>
              </div>
            </form>
          )}
        </section>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              Actualizar empresa
            </h2>
            <p className="text-scale-3 mt-4 text-[var(--text-primary)]">
              Ajustá el nombre, el rol y los datos básicos de tu ficha para mantener la información actualizada.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
