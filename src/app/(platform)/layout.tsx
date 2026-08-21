import { SessionGate } from "./_components/auth/SessionGate";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </SessionGate>
  );
}
