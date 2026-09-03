"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationSummary,
} from "@/lib/api/notifications";
import { navItems } from "../_lib/constants";
import { TopBar } from "../_components/TopBar";

type NotificationLead = {
  kind: "initials" | "symbol";
  value: string;
  tone: "navy" | "gold" | "green" | "red" | "gray" | "teal";
};

const QUICK_LINKS = [
  { label: "Mensajes", href: "/mensajes" },
  { label: "Mi Perfil", href: "/perfil" },
  { label: "Configuración", href: "/account/configuration" },
];

const LEAD_TONE_CLASS: Record<NotificationLead["tone"], string> = {
  navy: "bg-[color-mix(in_srgb,var(--navy-900)_92%,var(--surface))] text-[var(--surface)]",
  gold: "bg-[color-mix(in_srgb,var(--brand-100)_75%,var(--surface))] text-[var(--brand-700)]",
  green: "bg-[color-mix(in_srgb,var(--surface-muted)_88%,var(--surface))] text-[color-mix(in_srgb,var(--navy-900)_72%,var(--surface))]",
  red: "bg-[color-mix(in_srgb,var(--brand-50)_68%,var(--surface))] text-[var(--danger-500)]",
  gray: "bg-[color-mix(in_srgb,var(--surface-2)_88%,var(--surface))] text-[var(--navy-900)]",
  teal: "bg-[color-mix(in_srgb,var(--surface-muted)_65%,var(--surface))] text-[var(--surface)]",
};

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} d`;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function NotificationBody({
  item,
  onMarkAsRead,
}: {
  item: NotificationSummary;
  onMarkAsRead: (notificationId: string) => Promise<void> | void;
}) {
  return (
    <p className="text-scale-3 leading-snug text-[var(--text-primary)]">
      {item.body.map((segment, index) => {
        const key = `${item.id}-segment-${index}`;

        if (!segment.href) {
          return (
            <span key={key} className={segment.isBold ? "font-semibold text-[var(--heading-primary)]" : undefined}>
              {segment.text}
            </span>
          );
        }

        return (
          <Link
            key={key}
            href={segment.href}
            onClick={(event) => {
              event.stopPropagation();
              void onMarkAsRead(item.id);
            }}
            className={`transition-colors hover:text-[var(--link-accent-hover)] ${
              segment.isBold
                ? "font-semibold text-[var(--heading-primary)]"
                : "font-medium text-[var(--link-accent)]"
            }`}
          >
            {segment.text}
          </Link>
        );
      })}
    </p>
  );
}

function NotificationsSection({
  title,
  items,
  onMarkAsRead,
  headerAction,
}: {
  title: string;
  items: NotificationSummary[];
  onMarkAsRead: (notificationId: string) => Promise<void> | void;
  headerAction?: React.ReactNode;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="text-scale-2 font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
          {title}
        </h2>
        {headerAction}
      </div>

      <AppCard className="overflow-hidden p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const leadTone = item.lead.tone.toLowerCase() as NotificationLead["tone"];

          return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                void onMarkAsRead(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void onMarkAsRead(item.id);
                }
              }}
              className={`group grid cursor-pointer grid-cols-[3rem_minmax(0,1fr)_1rem] gap-3 px-4 py-4 outline-none transition-colors focus-visible:bg-[color-mix(in_srgb,var(--brand-50)_54%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--brand-50)_42%,var(--surface))] sm:grid-cols-[3.4rem_minmax(0,1fr)_1rem] ${
                item.read ? "bg-[var(--surface)]" : "bg-[color-mix(in_srgb,var(--brand-50)_26%,var(--surface))]"
              } ${isLast ? "" : "border-b border-[var(--line)]"}`}
            >
              <div
                className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${LEAD_TONE_CLASS[leadTone]}`}
              >
                <span className="text-scale-3 leading-none">{item.lead.value}</span>
              </div>

              <div className="min-w-0">
                <NotificationBody item={item} onMarkAsRead={onMarkAsRead} />
                <p className="text-scale-2 mt-1 text-[var(--text-secondary)]">
                  {item.timeLabelOverride ?? formatRelativeTime(item.createdAt)}
                </p>
                {item.action ? (
                  <Link
                    href={item.action.href}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onMarkAsRead(item.id);
                    }}
                    className="text-scale-2 mt-1 inline-flex font-semibold text-[var(--brand-700)] transition-colors hover:text-[var(--brand-900)]"
                  >
                    {item.action.label}
                  </Link>
                ) : null}
              </div>

              <div className="pt-1">
                {!item.read ? (
                  <span className="mt-0.5 inline-flex h-3 w-3 rounded-full border border-[var(--brand-100)] bg-[var(--brand-500)]" />
                ) : null}
              </div>
            </article>
          );
        })}
      </AppCard>
    </section>
  );
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await listNotifications(50, controller.signal);

        if (!isActive) return;
        setNotifications(response.data.notifications);
      } catch (caughtError) {
        if (controller.signal.aborted || (caughtError instanceof Error && caughtError.name === "AbortError")) {
          return;
        }

        if (isActive) {
          setError(
            caughtError instanceof Error && caughtError.message
              ? caughtError.message
              : "No pudimos cargar tus notificaciones."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications]
  );

  const readNotifications = useMemo(
    () => notifications.filter((notification) => notification.read),
    [notifications]
  );

  const markAsRead = async (notificationId: string) => {
    const previousNotifications = notifications;
    const target = previousNotifications.find((notification) => notification.id === notificationId);

    if (!target || target.read) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true, readAt: new Date().toISOString() }
          : notification
      )
    );

    try {
      await markNotificationAsRead(notificationId);
    } catch (caughtError) {
      setNotifications(previousNotifications);
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos marcar la notificación como leída.");
    }
  };

  const markAllAsRead = async () => {
    if (unreadNotifications.length === 0) {
      return;
    }

    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((notification) =>
        notification.read
          ? notification
          : { ...notification, read: true, readAt: new Date().toISOString() }
      )
    );

    try {
      await markAllNotificationsAsRead();
    } catch (caughtError) {
      setNotifications(previousNotifications);
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos marcar todas como leídas.");
    }
  };

  return (
    <div className="mathesis-shell min-h-screen">
      <TopBar navItems={navItems} />
      <main className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <div className="px-1 pb-4">
          <h1 className="text-scale-5 font-[family-name:var(--font-spectral)] font-semibold text-[var(--heading-primary)]">
            Notificaciones
          </h1>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] px-3 py-2 text-scale-2 text-[var(--danger-700)]">
            {error}
          </div>
        ) : null}

        {isLoading && notifications.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-scale-2 text-[var(--text-secondary)]">
            Cargando notificaciones…
          </div>
        ) : notifications.length === 0 ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-stretch lg:gap-8 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
            <div className="flex min-h-0 items-center justify-center rounded-xl border border-transparent bg-transparent px-4 py-3 text-center">
              <p className="text-scale-2 font-medium text-[var(--text-primary)]">No tenés notificaciones.</p>
            </div>

            <aside className="hidden h-full border-l border-[var(--line)] pl-8 lg:block">
              <AppCard className="p-4">
                <h2 className="text-scale-4 font-[family-name:var(--font-spectral)] font-semibold text-[var(--heading-primary)]">
                  Accesos rápidos
                </h2>
                <div className="mt-3 divide-y divide-[var(--line)]">
                  {QUICK_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-scale-3 block py-2.5 text-[var(--text-primary)] transition-colors hover:text-[var(--link-accent)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </AppCard>
            </aside>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-stretch lg:gap-8 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
            <div className="space-y-4">
              <NotificationsSection
                title="No leídas"
                items={unreadNotifications}
                onMarkAsRead={markAsRead}
                headerAction={
                  <button
                    type="button"
                    onClick={() => {
                      void markAllAsRead();
                    }}
                    className="text-scale-2 rounded-full px-2 py-1 font-semibold text-[var(--brand-700)] transition-colors hover:text-[var(--brand-900)]"
                  >
                    Marcar todo leído
                  </button>
                }
              />

              <NotificationsSection title="Leídas" items={readNotifications} onMarkAsRead={markAsRead} />
            </div>

            <aside className="hidden h-full border-l border-[var(--line)] pl-8 lg:block">
              <AppCard className="p-4">
                <h2 className="text-scale-4 font-[family-name:var(--font-spectral)] font-semibold text-[var(--heading-primary)]">
                  Accesos rápidos
                </h2>
                <div className="mt-3 divide-y divide-[var(--line)]">
                  {QUICK_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-scale-3 block py-2.5 text-[var(--text-primary)] transition-colors hover:text-[var(--link-accent)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </AppCard>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
