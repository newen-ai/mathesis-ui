import type { Metadata } from "next";
import { Sora, Spectral } from "next/font/google";
import { AppToaster } from "@/components/ui/AppToaster";
import { PoweredByFooter } from "@/components/ui/PoweredByFooter";
import { ThemeInitializer } from "@/components/theme/ThemeInitializer";
import { withBasePath } from "@/lib/assets";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${sora.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeInitializer />
        <div className="min-h-full pb-10 md:pb-11">{children}</div>
        <PoweredByFooter />
        <AppToaster />
      </body>
    </html>
  );
}
