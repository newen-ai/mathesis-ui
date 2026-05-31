import { SessionGate } from "./_components/auth/SessionGate";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionGate>{children}</SessionGate>;
}
