import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full appearance-none rounded-[var(--radius-control)] border border-outline-variant bg-surface-container-high px-3.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}
