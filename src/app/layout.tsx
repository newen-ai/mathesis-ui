import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sora, Spectral } from "next/font/google";
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
  title: "Sophium | Red Profesional",
  description:
    "Red profesional de Sophium para construir perfiles y mostrar experiencia laboral.",
  icons: {
    icon: withBasePath("/sophium-logo.png"),
    shortcut: withBasePath("/sophium-logo.png"),
    apple: withBasePath("/sophium-logo.png"),
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
      className={`${sora.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden">
        <ThemeInitializer />
        <div className="min-h-full overflow-x-hidden">{children}</div>
        <AuthLanguageSwitcher />
        <BugReportWidget />
        <AppToaster />
      </body>
    </html>
  );
}
