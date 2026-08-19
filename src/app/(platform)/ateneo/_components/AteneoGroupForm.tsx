"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ateneoBadgeOptions, ateneoIconOptions, ateneoLanguageOptions, ateneoPermissionOptions, type AteneoPermissionMode } from "../_lib/mock-data";

type GroupFormValues = {
  iconId: string;
  name: string;
  description: string;
  rules: string;
  language: (typeof ateneoLanguageOptions)[number];
  badges: string[];
  isOfficialGroup: boolean;
  createTopicsMode: AteneoPermissionMode;
  commentsMode: AteneoPermissionMode;
};

type GroupFormErrors = {
  name?: string;
  description?: string;
};

type AteneoGroupFormProps = {
  title: string;
  submitLabel: string;
  backHref: string;
  backLabel: string;
  initialValues?: Partial<GroupFormValues>;
  onSubmit: (values: GroupFormValues) => Promise<void>;
};

const NAME_LIMIT = 40;
const DESCRIPTION_LIMIT = 300;
const RULES_LIMIT = 500;

function iconPreview(iconId: string) {
  if (iconId === "cafe") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4 7h11v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7Z" />
        <path d="M15 9h2.5a2 2 0 0 1 0 4H15" />
        <path d="M7 4.6v1.8M10 4.6v1.8" />
      </svg>
    );
  }

  if (iconId === "community" || iconId === "team") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="8.5" cy="9" r="2.2" />
        <circle cx="15.5" cy="10.5" r="2.2" />
        <path d="M4.5 18.5a4 4 0 0 1 8 0" />
        <path d="M11.5 18.5a4 4 0 0 1 8 0" />
      </svg>
    );
  }

  if (iconId === "gift") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M12 7v13M4 11h16" />
      </svg>
    );
  }

  if (iconId === "building") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4.5 20V6.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20" />
        <path d="M14.5 20h5V11.5a1 1 0 0 0-1-1h-4" />
      </svg>
    );
  }

  if (iconId === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4.8 10.8 12 5l7.2 5.8V20H4.8V10.8Z" />
        <path d="M9.5 20v-5h5v5" />
      </svg>
    );
  }

  if (iconId === "medal") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M9 12.5 7.8 20 12 17.5 16.2 20 15 12.5" />
      </svg>
    );
  }

  if (iconId === "target") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="12" cy="12" r="1.2" />
      </svg>
    );
  }

  if (iconId === "puzzle") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M9 4h4a2 2 0 1 1 4 0h3v5a2 2 0 1 1 0 4v5h-5a2 2 0 1 1-4 0H6v-5a2 2 0 1 1 0-4V4h3a2 2 0 1 1 0 4" />
      </svg>
    );
  }

  if (iconId === "spark") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M12 3.5v3M12 17.5v3M4.5 12h3M16.5 12h3M6.9 6.9l2.1 2.1M15 15l2.1 2.1M17.1 6.9 15 9M9 15l-2.1 2.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="m4 9 8-4 8 4-8 4-8-4Z" />
      <path d="M6.8 12.8 12 15.4l5.2-2.6" />
    </svg>
  );
}

export function AteneoGroupForm({ title, submitLabel, backHref, backLabel, initialValues, onSubmit }: AteneoGroupFormProps) {
  const [errors, setErrors] = useState<GroupFormErrors>({});
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isBadgesPickerOpen, setIsBadgesPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<GroupFormValues>({
    iconId: initialValues?.iconId ?? ateneoIconOptions[0]?.id ?? "cube",
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    rules: initialValues?.rules ?? "",
    language: initialValues?.language ?? ateneoLanguageOptions[0],
    badges: initialValues?.badges ?? [],
    isOfficialGroup: initialValues?.isOfficialGroup ?? false,
    createTopicsMode: initialValues?.createTopicsMode ?? "free",
    commentsMode: initialValues?.commentsMode ?? "free"
  });

  const selectedIconLabel = useMemo(() => {
    const option = ateneoIconOptions.find((icon) => icon.id === form.iconId);
    return option?.label ?? "Ícono";
  }, [form.iconId]);

  const selectedBadgesLabel = useMemo(() => {
    if (form.badges.length === 0) {
      return "Ninguna (sin restricción)";
    }

    return ateneoBadgeOptions
      .filter((badge) => form.badges.includes(badge.id))
      .map((badge) => badge.label)
      .join(" · ");
  }, [form.badges]);

  const onFieldChange = <K extends keyof GroupFormValues>(field: K, value: GroupFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (field === "name" && typeof value === "string" && value.trim().length > 0) {
      setErrors((current) => ({ ...current, name: undefined }));
    }

    if (field === "description" && typeof value === "string" && value.trim().length > 0) {
      setErrors((current) => ({ ...current, description: undefined }));
    }
  };

  const toggleBadge = (badgeId: string) => {
    setForm((current) => {
      const hasBadge = current.badges.includes(badgeId);
      return {
        ...current,
        badges: hasBadge ? current.badges.filter((value) => value !== badgeId) : [...current.badges, badgeId]
      };
    });
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: GroupFormErrors = {};

    if (form.name.trim().length === 0) {
      nextErrors.name = "El nombre del grupo es obligatorio.";
    }

    if (form.description.trim().length === 0) {
      nextErrors.description = "La descripción es obligatoria.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch {
      toast.error("No pudimos guardar el grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1450px] px-4 py-6 sm:px-6 lg:px-10">
        <form onSubmit={submitForm} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" noValidate>
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
              aria-label={backLabel}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m14.5 5.5-6 6 6 6" />
              </svg>
            </Link>

            <h1 className="font-[family-name:var(--font-spectral)] text-[1.7rem] font-semibold leading-tight text-[var(--heading-primary)]">
              {title}
            </h1>
          </div>

          <div className="mt-5 grid gap-4 sm:gap-5">
            <section>
              <p className="mb-2 text-scale-2 font-semibold text-[var(--heading-primary)]">Ícono del grupo</p>

              <button
                type="button"
                onClick={() => setIsIconPickerOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--line-strong)]"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
                    {iconPreview(form.iconId)}
                  </span>
                  <span className="text-scale-3 font-semibold text-[var(--heading-primary)]">Elegir ícono... ({selectedIconLabel})</span>
                </span>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 text-[var(--text-secondary)] transition ${isIconPickerOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isIconPickerOpen ? (
                <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {ateneoIconOptions.map((icon) => {
                      const isSelected = form.iconId === icon.id;
                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => onFieldChange("iconId", icon.id)}
                          className={`flex h-14 w-full items-center justify-center rounded-2xl border transition ${
                            isSelected
                              ? "border-[var(--brand-500)] bg-[var(--navy-900)] text-[var(--brand-500)]"
                              : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                          }`}
                          title={icon.label}
                        >
                          {iconPreview(icon.id)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <section>
              <label htmlFor="group-name" className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">
                Nombre del grupo
              </label>
              <input
                id="group-name"
                type="text"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value.slice(0, NAME_LIMIT))}
                placeholder="Ej: Ajedrez y Estrategia..."
                className={`w-full rounded-xl border px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] ${
                  errors.name
                    ? "border-[var(--danger-500)] bg-[var(--surface)]"
                    : "border-[var(--line)] bg-[var(--surface)] focus:border-[var(--brand-700)]"
                }`}
              />
              <div className="mt-1 flex justify-between text-scale-1 text-[var(--text-secondary)]">
                <span>{errors.name ?? ""}</span>
                <span>{form.name.length}/{NAME_LIMIT}</span>
              </div>
            </section>

            <section>
              <label htmlFor="group-description" className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">
                Descripción
              </label>
              <textarea
                id="group-description"
                rows={3}
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value.slice(0, DESCRIPTION_LIMIT))}
                placeholder="De qué se trata este grupo..."
                className={`w-full resize-y rounded-xl border px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] ${
                  errors.description
                    ? "border-[var(--danger-500)] bg-[var(--surface)]"
                    : "border-[var(--line)] bg-[var(--surface)] focus:border-[var(--brand-700)]"
                }`}
              />
              <div className="mt-1 flex justify-between text-scale-1 text-[var(--text-secondary)]">
                <span>{errors.description ?? ""}</span>
                <span>{form.description.length}/{DESCRIPTION_LIMIT}</span>
              </div>
            </section>

            <section>
              <label htmlFor="group-rules" className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">
                Reglas propias (opcional)
              </label>
              <textarea
                id="group-rules"
                rows={3}
                value={form.rules}
                onChange={(event) => onFieldChange("rules", event.target.value.slice(0, RULES_LIMIT))}
                placeholder="Solo suman a las reglas base, nunca las reemplazan..."
                className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--brand-700)]"
              />
              <div className="mt-1 text-right text-scale-1 text-[var(--text-secondary)]">
                {form.rules.length}/{RULES_LIMIT}
              </div>
            </section>

            <section className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">Idioma</span>
                <select
                  value={form.language}
                  onChange={(event) => onFieldChange("language", event.target.value as GroupFormValues["language"])}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
                >
                  {ateneoLanguageOptions.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">Crear temas</span>
                  <select
                    value={form.createTopicsMode}
                    onChange={(event) => onFieldChange("createTopicsMode", event.target.value as AteneoPermissionMode)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
                  >
                    {ateneoPermissionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-scale-2 font-semibold text-[var(--heading-primary)]">Comentarios</span>
                  <select
                    value={form.commentsMode}
                    onChange={(event) => onFieldChange("commentsMode", event.target.value as AteneoPermissionMode)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
                  >
                    {ateneoPermissionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section>
              <p className="mb-2 text-scale-2 font-semibold text-[var(--heading-primary)]">Insignias requeridas</p>
              <button
                type="button"
                onClick={() => setIsBadgesPickerOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-left"
                aria-expanded={isBadgesPickerOpen}
                aria-label="Seleccionar insignias"
              >
                <span className="text-scale-3 text-[var(--text-primary)]">{selectedBadgesLabel}</span>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 text-[var(--text-secondary)] transition ${isBadgesPickerOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isBadgesPickerOpen ? (
                <div className="mt-2 space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  {ateneoBadgeOptions.map((badge) => {
                    const isChecked = form.badges.includes(badge.id);
                    return (
                      <label
                        key={badge.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-scale-2 text-[var(--text-primary)]"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBadge(badge.id)}
                          className="h-4 w-4 rounded border-[var(--line-strong)] accent-[var(--brand-500)]"
                        />
                        <span>{badge.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 opacity-75">
              <div className="flex items-center justify-between gap-3">
                <span>
                  <strong className="block text-scale-4 text-[var(--text-secondary)]">Grupo oficial</strong>
                  <span className="mt-1 block text-scale-2 text-[var(--text-secondary)]">
                    Solo personas autorizadas pueden marcar un grupo como oficial. <span className="font-semibold">Próximamente.</span>
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-8 w-14 shrink-0 items-center opacity-40">
                    <input type="checkbox" checked={form.isOfficialGroup} disabled className="peer sr-only" />
                    <span className="absolute inset-0 rounded-full bg-[var(--line)] transition peer-checked:bg-[var(--brand-500)]" />
                    <span className="absolute left-1 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-6" />
                  </span>

                  <span className="group relative inline-flex">
                    <button
                      type="button"
                      aria-label="Información sobre grupo oficial"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 10.5v5" />
                        <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </button>

                    <span className="pointer-events-none absolute right-0 top-10 z-10 w-max rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-scale-1 font-medium text-[var(--text-secondary)] opacity-0 shadow-sm transition group-hover:opacity-100">
                      Coming soon
                    </span>
                  </span>
                </div>
              </div>
            </section>

            <div className="pt-1 text-center">
              <Link href={backHref} className="text-scale-3 font-semibold mathesis-link-accent">
                ← {backLabel}
              </Link>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-7 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Guardando..." : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
