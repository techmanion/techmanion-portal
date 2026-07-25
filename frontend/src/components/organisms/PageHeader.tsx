import type { ReactNode } from "react";
import { PageTitle } from "../atoms/Typography";
import { PageHeaderActions } from "../molecules/PageHeaderActions";

export function PageHeader({
  title,
  description,
  meta,
  actions,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle>{title}</PageTitle>
          {meta}
        </div>
        {description && <p className="mt-1.5 text-sm text-on-surface-variant">{description}</p>}
      </div>
      {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
    </div>
  );
}
