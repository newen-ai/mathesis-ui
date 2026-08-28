import { SessionGate } from "./_components/auth/SessionGate";
import { BugReportWidget } from "./_components/BugReportWidget";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh flex-col overflow-x-hidden">
        <main className="flex-1">{children}</main>
        <BugReportWidget />
      </div>
    </SessionGate>
  );
}
