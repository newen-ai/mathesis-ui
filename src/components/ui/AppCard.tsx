import { ComponentPropsWithoutRef, ReactNode } from "react";

type AppCardProps = ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
};

export function AppCard({ children, className = "", ...rest }: AppCardProps) {
  return (
    <section {...rest} className={`linkedin-card ${className}`.trim()}>
      {children}
    </section>
  );
}
