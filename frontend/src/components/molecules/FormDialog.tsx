import { useEffect, useId, type FormEvent, type ReactNode } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function FormDialog({
  open,
  title,
  description,
  icon = "edit",
  submitLabel = "Save",
  submittingLabel = "Saving…",
  submitting = false,
  submitDisabled = false,
  error,
  width = "md",
  onSubmit,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: string;
  submitLabel?: string;
  submittingLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  error?: string;
  width?: keyof typeof widths;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto px-4 py-8">
      <div aria-hidden="true" className="fixed inset-0 bg-black/50" onClick={submitting ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`surface-panel relative w-full ${widths[width]} p-6`}
      >
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="text-[20px]">{icon}</Icon>
          </span>
          <div>
            <h2 id={titleId} className="text-heading font-medium text-on-surface">{title}</h2>
            {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}
          {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
          <div className="mt-2 flex justify-end gap-2.5 border-t border-outline-variant/30 pt-5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || submitDisabled}>
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
