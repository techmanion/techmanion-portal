import type { ReactNode } from "react";
import { Eyebrow } from "../atoms/Typography";

export function FormField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <Eyebrow className="px-1">{label}</Eyebrow>
      {children}
      {hint && <span className="px-1 text-xs text-on-surface-variant/70">{hint}</span>}
    </label>
  );
}
