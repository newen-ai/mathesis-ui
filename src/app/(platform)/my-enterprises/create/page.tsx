"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEnterprise as createEnterpriseRequest } from "@/lib/api/enterprise";
import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";

type CreateEnterpriseForm = {
  companyName: string;
  role: string;
  website: string;
  description: string;
};

type CreateEnterpriseErrors = {
  companyName?: string;
  role?: string;
};

const REQUIRED_FIELD_MESSAGE = "Este campo es obligatorio.";

export default function CreateEnterprisePage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateEnterpriseForm>({
    companyName: "",
    role: "",
    website: "",
    description: "",
  });
  const [errors, setErrors] = useState<CreateEnterpriseErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFieldChange = (field: keyof CreateEnterpriseForm, value: string) => {
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

    const nextErrors: CreateEnterpriseErrors = {};

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
      const response = await createEnterpriseRequest({
        companyName: form.companyName.trim(),
        role: form.role.trim(),
        website: form.website.trim() || undefined,
        description: form.description.trim() || undefined
      });

      if (!response.success) {
        setSubmitError(response.message || "No pudimos crear la empresa.");
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
            Solicitar Mensa Empresarios
          </h1>
          <p className="text-scale-3 mt-2 text-[var(--text-secondary)]">
            Contanos sobre tu empresa. Tu solicitud la revisa el equipo de Mensa Empresarios — te avisamos por notificación.
          </p>

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
                placeholder="Ej: CEO y fundador"
                className={`text-scale-3 mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)] ${errors.role ? "border-[var(--danger-500)]" : "border-[var(--line)]"}`}
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
                placeholder="www.tuempresa.com"
                className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
              />
            </label>

            <label className="block">
              <span className="text-scale-3 mathesis-heading-primary font-semibold">Descripción breve</span>
              <textarea
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                rows={3}
                placeholder="¿A qué se dedica tu empresa?"
                className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="text-scale-4 mathesis-on-brand mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-3 font-semibold"
            >
              {isSubmitting ? "Creando..." : "Crear empresa"}
            </button>

            {submitError ? (
              <p className="text-scale-2 text-[var(--danger-500)]">{submitError}</p>
            ) : null}

            <p className="text-scale-2 text-[var(--text-secondary)]">
              <span className="text-[var(--danger-500)]">*</span> Campos obligatorios.
            </p>

            <div className="pt-1 text-center">
              <Link
                href="/my-enterprises"
                className="text-scale-4 mathesis-link-accent font-semibold transition"
              >
                ← Volver a buscar
              </Link>
            </div>
          </form>
        </section>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              ¿Qué es Mensa Empresarios?
            </h2>
            <p className="text-scale-3 mt-4 leading-relaxed text-[var(--text-primary)]">
              Membresía adicional para Miembros con empresa propia o startup. Suma acceso a un directorio de empresas verificadas y a un Feed exclusivo de networking entre empresarios Mensa.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              Cómo funciona
            </h2>
            <p className="text-scale-3 mt-4 leading-relaxed text-[var(--text-primary)]">
              Tu solicitud la revisa el equipo de Mensa Empresarios y te avisamos por notificación cuando quede aprobada.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}