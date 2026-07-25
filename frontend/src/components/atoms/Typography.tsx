import type { ReactNode } from "react";

export function PageTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-title font-semibold tracking-tight text-on-surface ${className}`}>{children}</h1>;
}

export function SectionHeading({
  children,
  accent = "primary",
  className = "",
}: {
  children: ReactNode;
  accent?: "primary" | "tertiary";
  className?: string;
}) {
  return (
    <h2 className={`flex items-center gap-3 text-heading font-medium text-on-surface ${className}`}>
      <span className={`h-6 w-1.5 rounded-full ${accent === "primary" ? "bg-primary" : "bg-tertiary"}`} />
      {children}
    </h2>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant ${className}`}>
      {children}
    </span>
  );
}
