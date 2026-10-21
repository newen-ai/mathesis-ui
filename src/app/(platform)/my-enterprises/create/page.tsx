"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function CreateEnterprisePage() {
  const { t } = useTranslation("myEnterprises");
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
      nextErrors.companyName = t("create.requiredField");
    }

    if (form.role.trim().length === 0) {
      nextErrors.role = t("create.requiredField");
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
        setSubmitError(response.message || t("create.errors.create"));
        return;
      }

      router.push("/my-enterprises");
    } catch {
      setSubmitError(t("create.errors.service"));
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
            {t("create.title")}
          </h1>
          <p className="text-scale-3 mt-2 text-[var(--text-secondary)]">
            {t("create.subtitle")}
          </p>

          <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
            <label className="block">
              <span className="text-scale-3 mathesis-heading-primary font-semibold">
                {t("create.fields.companyName")} <span className="text-[var(--danger-500)]">*</span>
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
                {t("create.fields.role")} <span className="text-[var(--danger-500)]">*</span>
              </span>
              <input
                value={form.role}
                onChange={(event) => onFieldChange("role", event.target.value)}
                type="text"
                placeholder={t("create.placeholders.role")}
                className={`text-scale-3 mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)] ${errors.role ? "border-[var(--danger-500)]" : "border-[var(--line)]"}`}
              />
              {errors.role ? (
                <p className="text-scale-2 mt-1 text-[var(--danger-500)]">{errors.role}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-scale-3 mathesis-heading-primary font-semibold">{t("create.fields.website")}</span>
              <input
                value={form.website}
                onChange={(event) => onFieldChange("website", event.target.value)}
                type="text"
                placeholder={t("create.placeholders.website")}
                className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
              />
            </label>

            <label className="block">
              <span className="text-scale-3 mathesis-heading-primary font-semibold">{t("create.fields.description")}</span>
              <textarea
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                rows={3}
                placeholder={t("create.placeholders.description")}
                className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="text-scale-4 mathesis-on-brand mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-3 font-semibold"
            >
              {isSubmitting ? t("create.submit.loading") : t("create.submit.idle")}
            </button>

            {submitError ? (
              <p className="text-scale-2 text-[var(--danger-500)]">{submitError}</p>
            ) : null}

            <p className="text-scale-2 text-[var(--text-secondary)]">
              <span className="text-[var(--danger-500)]">*</span> {t("create.requiredLegend")}
            </p>

            <div className="pt-1 text-center">
              <Link
                href="/my-enterprises"
                className="text-scale-4 mathesis-link-accent font-semibold transition"
              >
                {t("create.back")}
              </Link>
            </div>
          </form>
        </section>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              {t("create.aside.whatIsTitle")}
            </h2>
            <p className="text-scale-3 mt-4 leading-relaxed text-[var(--text-primary)]">
              {t("create.aside.whatIsBody")}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 mathesis-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              {t("create.aside.howItWorksTitle")}
            </h2>
            <p className="text-scale-3 mt-4 leading-relaxed text-[var(--text-primary)]">
              {t("create.aside.howItWorksBody")}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}