"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function EditEnterprisePage() {
  const { t } = useTranslation("myEnterprises");
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
        setSubmitError(t("edit.errors.load"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadEnterprise();
  }, [enterpriseId, router, t]);

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
      nextErrors.companyName = t("edit.requiredField");
    }

    if (form.role.trim().length === 0) {
      nextErrors.role = t("edit.requiredField");
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
        setSubmitError(response.message || t("edit.errors.save"));
        return;
      }

      router.push("/my-enterprises");
    } catch {
      setSubmitError(t("edit.errors.service"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7 lg:px-10 lg:py-8">
        <section className="min-w-0 border-r-0 lg:border-r lg:border-[var(--line)] lg:pr-7">
          <h1 className="text-scale-5 sophium-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
            {t("edit.title")}
          </h1>

          {isLoading ? (
            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[var(--text-secondary)]">
              {t("edit.loading")}
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
              <label className="block">
                <span className="text-scale-3 sophium-heading-primary font-semibold">
                  {t("edit.fields.companyName")} <span className="text-[var(--danger-500)]">*</span>
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
                <span className="text-scale-3 sophium-heading-primary font-semibold">
                  {t("edit.fields.role")} <span className="text-[var(--danger-500)]">*</span>
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
                <span className="text-scale-3 sophium-heading-primary font-semibold">{t("edit.fields.website")}</span>
                <input
                  value={form.website}
                  onChange={(event) => onFieldChange("website", event.target.value)}
                  type="text"
                  className="text-scale-3 mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-500)_24%,transparent)]"
                />
              </label>

              <label className="block">
                <span className="text-scale-3 sophium-heading-primary font-semibold">{t("edit.fields.description")}</span>
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
                className="text-scale-4 sophium-on-brand mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("edit.submit.loading") : t("edit.submit.idle")}
              </button>

              {submitError ? (
                <p className="text-scale-2 text-[var(--danger-500)]">{submitError}</p>
              ) : null}

              <div className="pt-1 text-center">
                <Link href="/my-enterprises" className="text-scale-4 sophium-link-accent font-semibold transition">
                  {t("edit.back")}
                </Link>
              </div>
            </form>
          )}
        </section>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <h2 className="text-scale-4 sophium-heading-primary font-[family-name:var(--font-spectral)] font-semibold">
              {t("edit.aside.title")}
            </h2>
            <p className="text-scale-3 mt-4 text-[var(--text-primary)]">
              {t("edit.aside.body")}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
