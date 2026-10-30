import type { InputHTMLAttributes, Ref } from "react";

export function Input({
  className = "",
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={`h-10 w-full rounded-[var(--radius-control)] border border-outline-variant bg-transparent px-3.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}
