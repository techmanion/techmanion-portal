import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Input } from "../atoms/Input";
import { FormField } from "./FormField";
import { ApiError } from "../../lib/api";
import { changePassword } from "../../lib/api/auth";
import { useToast } from "../../toast";

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password updated.");
      handleClose();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Password could not be changed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="surface-panel relative w-full max-w-sm p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tertiary/10 text-tertiary">
            <Icon className="text-[20px]">lock</Icon>
          </span>
          <h2 id="change-password-title" className="text-heading font-medium text-on-surface">
            Change password
          </h2>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FormField label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoFocus
            />
          </FormField>
          <FormField label="New password" hint="At least 8 characters.">
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </FormField>
          <FormField label="Confirm new password">
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </FormField>
          {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
          <div className="mt-1 flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !currentPassword || !newPassword}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
