import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/ui/AppToaster";
import { AuthLanguageSwitcher } from "@/components/auth/AuthLanguageSwitcher";
import { BugReportWidget } from "./(platform)/_components/BugReportWidget";
import { ThemeInitializer } from "@/components/theme/ThemeInitializer";
import { withBasePath } from "@/lib/assets";
import {
  THEME_COOKIE_NAME,
  normalizeTheme,
} from "@/lib/theme/theme-preference";
import "./globals.css";

// Brand manual: Inter for the app UI; headings use Georgia (system font, see --font-display in globals.css).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sophium | Red Profesional",
  description:
    "Red profesional de Sophium para construir perfiles y mostrar experiencia laboral.",
  // Brand manual: favicon and app icon (symbol centred on cream).
  icons: {
    icon: [
      { url: withBasePath("/brand/favicon.png"), sizes: "192x192", type: "image/png" },
      { url: withBasePath("/brand/app-icon.png"), sizes: "512x512", type: "image/png" },
    ],
    shortcut: withBasePath("/brand/favicon.png"),
    apple: withBasePath("/brand/app-icon.png"),
  },
};

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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden">
        <ThemeInitializer />
        <div className="min-h-full overflow-x-hidden">{children}</div>
        <AuthLanguageSwitcher />
        <BugReportWidget />
        <AppToaster />
        {/* Real-user Core Web Vitals in Vercel > Speed Insights. Inert outside Vercel deployments. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
