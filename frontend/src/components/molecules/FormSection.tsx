import type { ReactNode } from "react";
import { SectionHeading } from "../atoms/Typography";

export function FormSection({
  heading,
  accent = "primary",
  bordered = true,
  className = "",
  children,
}: {
  heading: string;
  accent?: "primary" | "tertiary";
  bordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${bordered ? "border-t border-outline-variant/30 pt-7" : ""} ${className}`}>
      <SectionHeading accent={accent} className="mb-5">
        {heading}
      </SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
