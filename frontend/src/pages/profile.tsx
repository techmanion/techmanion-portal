import { useState } from "react";
import { useAuth } from "../auth";
import { Avatar, Button, Icon, Input } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { FormField } from "../components/molecules";
import { PageHeader } from "../components/organisms";
import { api, ApiError } from "../lib/api";
import { formatDate, roleLabel } from "../lib/format";
import type { User } from "../types";

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  if (!user) return null;

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setNameError("");
    setNameSaved(false);
    setSavingName(true);
    try {
      const updated = await api<User>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      updateUser(updated);
      setNameSaved(true);
      window.setTimeout(() => setNameSaved(false), 3000);
    } catch (reason) {
      setNameError(reason instanceof ApiError ? reason.message : "Profile could not be updated.");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      await api<void>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      window.setTimeout(() => setPasswordSaved(false), 3000);
    } catch (reason) {
      setPasswordError(reason instanceof ApiError ? reason.message : "Password could not be changed.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-7">
      <PageHeader className="mb-8 px-1" title="My Profile" description="Manage your account details and login credentials." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <section className="surface-panel flex flex-col items-center gap-4 p-8 text-center">
          <Avatar alt={user.name} size="xl" />
          <div>
            <h2 className="text-heading font-semibold text-on-surface">{user.name}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{user.email}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{roleLabel(user.role)}</span>
          <div className="mt-2 flex w-full items-center justify-center gap-2 border-t border-outline-variant/30 pt-4 text-xs text-on-surface-variant">
            <Icon className="text-[16px]">calendar_today</Icon>
            Member since {formatDate(user.createdAt)}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="surface-panel p-6">
            <SectionHeading className="mb-5"><Icon className="text-primary">badge</Icon>Account details</SectionHeading>
            <form onSubmit={saveName} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name">
                  <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} />
                </FormField>
                <FormField label="Work email" hint="Contact an administrator to change your email.">
                  <Input value={user.email} disabled className="opacity-60" />
                </FormField>
              </div>
              {nameError && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{nameError}</div>}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingName || !name.trim() || name.trim() === user.name}>
                  {savingName ? "Saving…" : "Save changes"}
                </Button>
                {nameSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <Icon className="text-[16px]">check_circle</Icon>
                    Saved
                  </span>
                )}
              </div>
            </form>
          </section>

          <section className="surface-panel p-6">
            <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">lock</Icon>Change password</SectionHeading>
            <form onSubmit={savePassword} className="flex flex-col gap-4">
              <FormField label="Current password">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              {passwordError && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{passwordError}</div>}
              <div className="flex items-center gap-3">
                <Button type="submit" variant="secondary" disabled={savingPassword || !currentPassword || !newPassword}>
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
                {passwordSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <Icon className="text-[16px]">check_circle</Icon>
                    Password updated
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
