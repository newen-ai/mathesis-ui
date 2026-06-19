"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { NavItem } from "../_lib/constants";
import { clearSession, readSession } from "@/lib/auth/session";
import { logout } from "@/lib/api/auth";
import { searchProfiles, type SearchProfileOutput } from "@/lib/api/profile";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const logoSrc = `${basePath}/mensa-empresarios-logo.svg`;

type TopBarProps = {
  navItems: NavItem[];
};

export function TopBar({ navItems }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName] = useState(() => readSession()?.user.name ?? "Miembro");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfileOutput[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const normalizedSearchText = useMemo(() => searchText.trim(), [searchText]);

  const isNavItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const onLogout = async () => {
    await logout();
    clearSession();
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    if (!normalizedSearchText) {
      setSearchResults([]);
      setSearchMessage("");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await searchProfiles(
          normalizedSearchText,
          controller.signal
        );

        if (!response.success) {
          setSearchResults([]);
          setSearchMessage(response.message || "No se pudo buscar perfiles");
          return;
        }

        setSearchResults(response.data);
        setSearchMessage(response.data.length === 0 ? "Sin resultados" : "");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setSearchResults([]);
        setSearchMessage("No se pudo buscar perfiles");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [normalizedSearchText]);

  const showSearchPanel =
    normalizedSearchText.length > 0 && (isSearching || searchResults.length > 0 || !!searchMessage);

  return (
    <header className="linkedin-topbar sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-slate-100/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Logo Mensa Empresarios"
            width={34}
            height={34}
            loading="eager"
            decoding="async"
          />
          <p className="text-sm font-semibold text-slate-900">Mensa Empresarios</p>
        </Link>

        <div className="relative ml-auto w-full max-w-md">
          <label className="sr-only" htmlFor="topbar-search">
            Buscar perfiles
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">Buscar</span>
            <input
              id="topbar-search"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Nombre y apellido"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
              autoComplete="off"
            />
          </div>

          {showSearchPanel ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              {isSearching ? (
                <p className="px-3 py-2 text-sm text-slate-500">Buscando...</p>
              ) : null}

              {!isSearching && searchMessage ? (
                <p className="px-3 py-2 text-sm text-slate-500">{searchMessage}</p>
              ) : null}

              {!isSearching && searchResults.length > 0
                ? searchResults.map((profile) => (
                    <button
                      key={profile.userId}
                      type="button"
                      onClick={() => {
                        const selectedName = `${profile.firstName} ${profile.lastName}`;
                        setSearchText(selectedName);
                        setSearchResults([]);
                        setSearchMessage("");
                        router.push(`/perfil?userId=${encodeURIComponent(profile.userId)}`);
                      }}
                      className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition hover:bg-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {profile.firstName} {profile.lastName}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`linkedin-nav-item ${
                isNavItemActive(item.href) ? "is-active" : ""
              }`}
            >
              <span className="linkedin-nav-dot" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 pl-1">
          <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-600 xl:block">
            {userName}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </header>
  );
}
