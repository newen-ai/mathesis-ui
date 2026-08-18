import type { ReactNode } from "react";

type AteneoGroupLeftColumnProps = {
  children: ReactNode;
  className?: string;
};

export function AteneoGroupLeftColumn({ children, className = "" }: AteneoGroupLeftColumnProps) {
  return (
    <aside className={`hidden lg:flex lg:min-h-[640px] lg:items-center lg:justify-center lg:border-r lg:border-[var(--line)] ${className}`}>
      {children}
    </aside>
  );
}
