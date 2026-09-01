import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sora, Spectral } from "next/font/google";
import Script from "next/script";
import { AppToaster } from "@/components/ui/AppToaster";
import { PoweredByFooter } from "@/components/ui/PoweredByFooter";
import { ThemeInitializer } from "@/components/theme/ThemeInitializer";
import { withBasePath } from "@/lib/assets";
import {
  THEME_COOKIE_NAME,
  normalizeTheme,
} from "@/lib/theme/theme-preference";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Mathesis | Red Profesional",
  description:
    "Red profesional de Mathesis para construir perfiles y mostrar experiencia laboral.",
  icons: {
    icon: withBasePath("/mathesis-logo.png"),
    shortcut: withBasePath("/mathesis-logo.png"),
    apple: withBasePath("/mathesis-logo.png"),
  },
};

const themeBootstrapScript = `(() => {
  const isTheme = (value) => value === "light" || value === "dark";
  const readCookieTheme = () => {
    const entries = document.cookie.split(";");
    for (const rawEntry of entries) {
      const entry = rawEntry.trim();
      if (!entry.startsWith("${THEME_COOKIE_NAME}=")) {
        continue;
      }

      const value = decodeURIComponent(entry.slice("${THEME_COOKIE_NAME}".length + 1));
      return isTheme(value) ? value : null;
    }

    return null;
  };

  const fromStorage = (() => {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  })();
  const fromCookie = readCookieTheme();
  const fromSystem = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const nextTheme = isTheme(fromStorage) ? fromStorage : (fromCookie ?? fromSystem);

  document.documentElement.setAttribute("data-theme", nextTheme);

  try {
    localStorage.setItem("theme", nextTheme);
  } catch {}

  document.cookie = "${THEME_COOKIE_NAME}=" + encodeURIComponent(nextTheme) + "; Path=/; Max-Age=31536000; SameSite=Lax";
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialTheme = normalizeTheme(cookieStore.get(THEME_COOKIE_NAME)?.value) ?? "light";

  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-theme={initialTheme}
      className={`${sora.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <ThemeInitializer />
        <div className="min-h-full overflow-x-hidden pb-10 md:pb-11">{children}</div>
        <PoweredByFooter />
        <AppToaster />
      </body>
    </html>
  );
}
