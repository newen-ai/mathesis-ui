import type { ReactNode } from "react";

type AteneoGroupRightColumnProps = {
  children: ReactNode;
  className?: string;
};

export function AteneoGroupRightColumn({ children, className = "" }: AteneoGroupRightColumnProps) {
  return (
    <aside className={`hidden space-y-4 pl-4 lg:block ${className}`}>
      {children}
    </aside>
  );
}
