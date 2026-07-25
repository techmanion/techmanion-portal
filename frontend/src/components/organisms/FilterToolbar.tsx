import type { ReactNode } from "react";

export function FilterToolbar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>{children}</div>;
}
