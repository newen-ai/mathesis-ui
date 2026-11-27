import type { ReactNode } from "react";

type AteneoGroupMiddleColumnProps = {
  topRow?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AteneoGroupMiddleColumn({ topRow, children, className = "" }: AteneoGroupMiddleColumnProps) {
  return (
    <div className={`min-w-0 lg:border-r lg:border-[var(--line)] ${className}`}>
      {topRow ? (
        <div className="border-b border-[var(--line)] px-4 py-2.5">
          {topRow}
        </div>
      ) : null}

      <div className="px-4 py-4">
      {children}
      </div>
    </div>
  );
}
