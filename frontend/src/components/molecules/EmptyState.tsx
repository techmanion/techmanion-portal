import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-32 place-items-center px-6 py-10 text-center text-sm text-on-surface-variant">
      {children}
    </div>
  );
}
