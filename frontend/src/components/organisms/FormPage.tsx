import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "../atoms/Button";
import { Breadcrumb } from "../molecules/Breadcrumb";

export function FormPage({
  breadcrumbTo,
  breadcrumbTrail,
  title,
  description,
  onSubmit,
  submitLabel,
  submittingLabel = "Saving…",
  submitting = false,
  cancelTo,
  error,
  children,
}: {
  breadcrumbTo: string;
  breadcrumbTrail: string[];
  title: ReactNode;
  description?: ReactNode;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  cancelTo: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb to={breadcrumbTo} trail={breadcrumbTrail} />
      <div className="mb-6">
        <h1 className="text-title font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-on-surface-variant">{description}</p>}
      </div>
      <form onSubmit={onSubmit} className="surface-panel space-y-8 p-6">
        {children}
        {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
        <div className="flex items-center gap-3 border-t border-outline-variant/30 pt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? submittingLabel : submitLabel}
          </Button>
          <Link
            to={cancelTo}
            className="inline-flex h-9 items-center rounded-full px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
