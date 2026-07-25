import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full rounded-[var(--radius-control)] border border-outline-variant bg-transparent px-3.5 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}
