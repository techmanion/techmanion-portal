import type { ReactNode } from "react";

export function Icon({
  children,
  className = "",
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? "material-symbols-filled" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
