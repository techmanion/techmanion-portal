import { useEffect } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="surface-panel relative w-full max-w-sm p-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full ${
              tone === "danger" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="text-[20px]">{tone === "danger" ? "warning" : "help"}</Icon>
          </span>
          <h2 id="confirm-dialog-title" className="text-heading font-medium text-on-surface">
            {title}
          </h2>
        </div>
        {description && <p className="mb-6 text-sm text-on-surface-variant">{description}</p>}
        <div className={`flex justify-end gap-2.5 ${description ? "" : "mt-6"}`}>
          <Button type="button" variant="ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button type="button" variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
