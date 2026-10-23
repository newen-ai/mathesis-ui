export function normalizeTopbarPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function isTopbarItemActive(pathname: string, href: string): boolean {
  const normalizedPathname = normalizeTopbarPathname(pathname);

  if (href === "/") {
    return normalizedPathname === "/";
  }

  if (href === "/perfil") {
    return normalizedPathname === "/perfil";
  }

  return normalizedPathname.startsWith(href);
}
