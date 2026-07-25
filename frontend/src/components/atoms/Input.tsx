import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-[var(--radius-control)] border border-outline-variant bg-transparent px-3.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}
