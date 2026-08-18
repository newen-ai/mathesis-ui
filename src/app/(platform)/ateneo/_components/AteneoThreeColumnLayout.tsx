import type { ReactNode } from "react";

type AteneoThreeColumnLayoutProps = {
  left?: ReactNode;
  middle: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function AteneoThreeColumnLayout({ left, middle, right, className = "" }: AteneoThreeColumnLayoutProps) {
  return (
    <section className={`grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-0 ${className}`}>
      {left ?? null}
      {middle}
      {right ?? null}
    </section>
  );
}
