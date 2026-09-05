import { SessionGate } from "./_components/auth/SessionGate";
import { BugReportWidget } from "./_components/BugReportWidget";
import { MobilePlatformFooter } from "./_components/MobilePlatformFooter";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh flex-col overflow-x-hidden">
        <main className="flex-1 pb-[calc(6.2rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <MobilePlatformFooter />
        <BugReportWidget />
      </div>
    </SessionGate>
  );
}
