import type { ReactNode } from "react";

/**
 * Standard page anatomy header (design-doc §2.3): page title top-left, a single
 * primary action top-right. Use on every page.
 */
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-[22px] font-medium leading-tight text-foreground">
        {title}
      </h1>
      {action}
    </div>
  );
}
