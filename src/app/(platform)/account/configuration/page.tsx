"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { logout } from "@/lib/api/auth";
import { type ThemeMode, useUiTheme } from "@/lib/theme/useUiTheme";
import { navItems } from "../../_lib/constants";
import { TopBar } from "../../_components/TopBar";

type SettingsCategoryKey =
  | "cuenta"
  | "privacidad"
  | "legal"
  | "acciones"
  | "ayuda";

type SettingsIconName =
  | "settings"
  | "lock"
  | "file"
  | "user"
  | "message"
  | "block"
  | "chevron"
  | "key"
  | "logout"
  | "deactivate"
  | "delete";

type SettingsRow =
  | {
      key: string;
      type: "theme";
      label: string;
      description?: string;
    }
  | {
      key: string;
      type: "language";
      label: string;
      description: string;
    }
  | {
      key: string;
      type: "placeholder";
      label: string;
      icon: SettingsIconName;
      detail?: string;
      variant?: "default" | "danger";
    }
  | {
      key: string;
      type: "logout";
      label: string;
      icon: SettingsIconName;
    };

type SettingsCategory = {
  key: SettingsCategoryKey;
  label: string;
  icon: SettingsIconName;
  rows: SettingsRow[];
};

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    key: "cuenta",
    label: "Cuenta",
    icon: "settings",
    rows: [
      {
        key: "theme",
        type: "theme",
        label: "Modo oscuro",
      },
      {
        key: "language",
        type: "language",
        label: "Idioma de la app",
        description:
          "Por ahora la app está solo en español — otros idiomas quedan para más adelante",
      },
    ],
  },
  {
    key: "privacidad",
    label: "Privacidad",
    icon: "lock",
    rows: [
      {
        key: "blocked",
        type: "placeholder",
        label: "Bloqueados",
        icon: "block",
        detail: "(1)",
      },
    ],
  },
  {
    key: "legal",
    label: "Legal",
    icon: "file",
    rows: [
      {
        key: "terms",
        type: "placeholder",
        label: "Términos y Condiciones",
        icon: "file",
      },
      {
        key: "privacy-policy",
        type: "placeholder",
        label: "Política de Privacidad",
        icon: "lock",
      },
    ],
  },
  {
    key: "acciones",
    label: "Acciones de cuenta",
    icon: "user",
    rows: [
      {
        key: "change-password",
        type: "placeholder",
        label: "Cambiar contraseña",
        icon: "key",
      },
      {
        key: "logout",
        type: "logout",
        label: "Cerrar sesión",
        icon: "logout",
      },
      {
        key: "deactivate",
        type: "placeholder",
        label: "Desactivar cuenta",
        icon: "deactivate",
        variant: "danger",
      },
      {
        key: "delete",
        type: "placeholder",
        label: "Eliminar cuenta de Mathesis",
        icon: "delete",
        variant: "danger",
      },
    ],
  },
  {
    key: "ayuda",
    label: "Ayuda y soporte",
    icon: "message",
    rows: [
      {
        key: "contact",
        type: "placeholder",
        label: "Contactar a Mathesis",
        icon: "message",
      },
    ],
  },
];

function SettingsIcon({
  name,
  className = "h-5 w-5",
}: {
  name: SettingsIconName;
  className?: string;
}) {
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3.1" />
        <path d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M7.5 10V8a4.5 4.5 0 1 1 9 0v2" />
        <rect x="5.5" y="10" width="13" height="10" rx="2.2" />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
        <path d="M14 3.8v4h4" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="3.1" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (name === "message") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
      </svg>
    );
  }

  if (name === "block") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="m7 7 10 10" />
      </svg>
    );
  }

  if (name === "key") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="8.25" cy="12" r="2.75" />
        <path d="M11 12h8m-2.5 0v-2.2M16 12v2.2" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M10 6H5.8A1.8 1.8 0 0 0 4 7.8v8.4A1.8 1.8 0 0 0 5.8 18H10" />
        <path d="M14 8.5 18 12l-4 3.5" />
        <path d="M9 12h9" />
      </svg>
    );
  }

  if (name === "deactivate") {
    return (
      <span className={`${className} inline-flex items-center justify-center gap-1`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 4.5 20 18.5H4L12 4.5Z" />
          <path d="M12 9v4.2M12 16.1h.01" />
        </svg>
      </span>
    );
  }

  if (name === "delete") {
    return (
      <span className={`${className} inline-flex items-center justify-center gap-1`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 7.5h14" />
          <path d="M8 7.5V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5" />
          <path d="m7.2 7.5.8 10.7a1 1 0 0 0 1 .8H15a1 1 0 0 0 1-.8l.8-10.7" />
          <path d="M10 11v5M14 11v5" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 4.5 20 18.5H4L12 4.5Z" />
          <path d="M12 9v4.2M12 16.1h.01" />
        </svg>
      </span>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function ThemeSwitch({
  theme,
}: {
  theme: ThemeMode;
}) {
  const enabled = theme === "dark";

  return (
    <span
      role="switch"
      aria-checked={enabled}
      className={`relative inline-flex h-10 w-[4.35rem] items-center rounded-full border transition ${
        enabled
          ? "border-[color:color-mix(in_srgb,var(--brand-500)_60%,transparent)] bg-[var(--brand-500)]"
          : "border-[var(--line)] bg-[var(--surface-muted)]"
      }`}
      aria-label="Cambiar modo oscuro"
    >
      <span
        className={`absolute top-1 h-8 w-8 rounded-full bg-[var(--surface)] shadow-sm transition ${
          enabled ? "left-[2.05rem]" : "left-1"
        }`}
      />
    </span>
  );
}

function SettingsRowButton({
  children,
  interactive = false,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  const className = `flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition md:px-0 md:py-5 ${
    interactive ? "cursor-pointer hover:bg-[var(--surface-2)]" : "cursor-default"
  } ${danger ? "text-[var(--danger-500)]" : "text-[var(--text-primary)]"}`;

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}

function MobileSectionTitle({ label }: { label: string }) {
  return (
    <div className="bg-[color:color-mix(in_srgb,var(--surface-muted)_88%,var(--line)_12%)] px-6 py-3 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
      {label}
    </div>
  );
}

function MobileBottomNav() {
  return (
    <nav className="mt-auto border-t border-[var(--line)] bg-[var(--surface)] px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4 lg:hidden">
      <ul className="grid grid-cols-5 items-end gap-2 text-center text-[0.78rem] font-medium text-[var(--text-secondary)]">
        <li>
          <Link href="/" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="5" y="4.5" width="14" height="15" rx="2" />
                <path d="M12 4.5v15M5 9.5h14" />
              </svg>
            </span>
            Nexum
          </Link>
        </li>
        <li>
          <Link href="/red" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="8" cy="9" r="2.5" />
                <circle cx="16" cy="9" r="2.5" />
                <path d="M4.5 18a4.5 4.5 0 0 1 7 0M12.5 18a4.5 4.5 0 0 1 7 0" />
              </svg>
            </span>
            Agora
          </Link>
        </li>
        <li>
          <button type="button" className="mx-auto block text-[var(--text-secondary)]">
            <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-500)] text-[var(--navy-900)] shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Crear
          </button>
        </li>
        <li>
          <Link href="/mensajes" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--text-secondary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
              </svg>
            </span>
            Mensajes
          </Link>
        </li>
        <li className="text-[var(--brand-500)]">
          <Link href="/perfil" className="block">
            <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center text-[var(--brand-500)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="3.1" />
                <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            Perfil
          </Link>
        </li>
      </ul>
    </nav>
  );
}


function ConfigurationSectionRows({
  rows,
  theme,
  onToggleTheme,
  onLogout,
  onOpenBlockedUsers,
  onOpenChangePassword,
  onOpenContact,
}: {
  rows: SettingsRow[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenBlockedUsers: () => void;
  onOpenChangePassword: () => void;
  onOpenContact: () => void;
}) {
  return rows.map((row, index) => {
    const withDivider = index < rows.length - 1;
    const rowBorderClass = withDivider
      ? "border-b border-[color:color-mix(in_srgb,var(--line)_82%,transparent)]"
      : "";

    if (row.type === "theme") {
      return (
        <div key={row.key} className={rowBorderClass}>
          <SettingsRowButton interactive onClick={onToggleTheme}>
            <div>
              <div className="text-[1.02rem] font-semibold leading-tight text-[var(--text-primary)] md:text-[1rem]">
                {row.label}
              </div>
            </div>
            <ThemeSwitch theme={theme} />
          </SettingsRowButton>
        </div>
      );
    }

    if (row.type === "language") {
      return (
        <div key={row.key} className={rowBorderClass}>
          <SettingsRowButton>
            <div className="max-w-[34rem]">
              <div className="text-[1.02rem] font-semibold leading-tight text-[var(--text-primary)] md:text-[1rem]">
                {row.label}
              </div>
              <div className="mt-1 max-w-[24rem] text-[0.92rem] leading-[1.15] text-[var(--text-secondary)] md:text-[0.9rem]">
                {row.description}
              </div>
            </div>
            <select
              aria-label="Idioma de la app"
              disabled
              defaultValue="Español"
              className="min-w-[9rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[1rem] font-medium text-[var(--text-secondary)] outline-none md:min-w-[8rem] md:px-3 md:py-2 md:text-[0.95rem]"
            >
              <option>Español</option>
            </select>
          </SettingsRowButton>
        </div>
      );
    }

    if (row.type === "logout") {
      return (
        <div key={row.key} className={rowBorderClass}>
          <SettingsRowButton interactive onClick={onLogout}>
            <div className="flex items-center gap-4">
              <span className="text-[var(--text-primary)]">
                <SettingsIcon name={row.icon} />
              </span>
              <div className="text-[1.02rem] font-semibold leading-tight text-[var(--text-primary)] md:text-[1rem]">
                {row.label}
              </div>
            </div>
          </SettingsRowButton>
        </div>
      );
    }

    const danger = row.variant === "danger";
    const clickHandlersByRowKey: Record<string, (() => void) | undefined> = {
      blocked: onOpenBlockedUsers,
      "change-password": onOpenChangePassword,
      contact: onOpenContact,
    };
    const onClick = clickHandlersByRowKey[row.key];
    const isInteractive = Boolean(onClick);

    return (
      <div key={row.key} className={rowBorderClass}>
        <SettingsRowButton
          danger={danger}
          interactive={isInteractive}
          onClick={onClick}
        >
          <div className="flex items-center gap-4">
            <span className={danger ? "text-[var(--danger-500)]" : "text-[var(--text-primary)]"}>
              <SettingsIcon name={row.icon} className="h-5 w-auto" />
            </span>
            <div className="flex items-center gap-3">
              <div className={`text-[1.02rem] font-semibold leading-tight md:text-[1rem] ${danger ? "text-[var(--danger-500)]" : "text-[var(--text-primary)]"}`}>
                {row.label}
              </div>
              {row.detail ? (
                <span className="text-[0.98rem] font-medium text-[var(--text-secondary)]">{row.detail}</span>
              ) : null}
            </div>
          </div>
          {!danger ? (
            <span className="text-[var(--text-soft)]">
              <SettingsIcon name="chevron" />
            </span>
          ) : null}
        </SettingsRowButton>
      </div>
    );
  });
}

export default function ConfigurationPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useUiTheme();
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>("cuenta");

  const activePanel = useMemo(
    () =>
      SETTINGS_CATEGORIES.find((category) => category.key === activeCategory) ??
      SETTINGS_CATEGORIES[0],
    [activeCategory]
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />
      <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1320px] flex-col lg:px-8 lg:py-8">
        <div className="lg:hidden">
          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-6 py-5">
            <h1 className="font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-none text-[var(--text-primary)]">
              Configuración
            </h1>
          </div>

          {SETTINGS_CATEGORIES.map((category) => (
            <section key={category.key} className="bg-[var(--surface)]">
              <MobileSectionTitle label={category.label} />
              <div>
                <ConfigurationSectionRows
                  rows={category.rows}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onLogout={handleLogout}
                  onOpenBlockedUsers={() => router.push("/account/configuration/blocked")}
                  onOpenChangePassword={() => router.push("/account/configuration/change-password")}
                  onOpenContact={() => router.push("/account/contact")}
                />
              </div>
            </section>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] lg:block">
          <div className="px-8 pb-5 pt-7">
            <h1 className="font-[family-name:var(--font-spectral)] text-[2.45rem] font-semibold leading-none text-[var(--text-primary)]">
              Configuración
            </h1>
          </div>

          <div className="border-t border-[var(--line)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="border-r border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface-muted)_78%,var(--surface))] px-4 py-6">
              <nav className="space-y-2">
                {SETTINGS_CATEGORIES.map((category) => {
                  const active = category.key === activeCategory;

                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setActiveCategory(category.key)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-[color:color-mix(in_srgb,var(--brand-100)_75%,var(--surface))] text-[var(--brand-800)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span className={active ? "text-[var(--brand-700)]" : "text-[var(--text-secondary)]"}>
                        <SettingsIcon name={category.icon} />
                      </span>
                      <span className="text-[1.05rem] font-semibold">{category.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="px-8 py-6">
              <div className="border-b border-[var(--line)] pb-4">
                <h2 className="font-[family-name:var(--font-spectral)] text-[2rem] font-semibold leading-none text-[var(--text-primary)]">
                  {activePanel.label}
                </h2>
              </div>

              <div className="divide-y divide-[color:color-mix(in_srgb,var(--line)_82%,transparent)]">
                <ConfigurationSectionRows
                  rows={activePanel.rows}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onLogout={handleLogout}
                  onOpenBlockedUsers={() => router.push("/account/configuration/blocked")}
                  onOpenChangePassword={() => router.push("/account/configuration/change-password")}
                  onOpenContact={() => router.push("/account/contact")}
                />
              </div>
            </section>
          </div>
        </div>

        <MobileBottomNav />
      </main>
    </div>
  );
}