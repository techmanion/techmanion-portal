import { useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, Input } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { ChangePasswordDialog, EditableAvatar, FormDialog, FormField } from "../components/molecules";
import { PageHeader } from "../components/organisms";
import { ApiError, avatarSrc } from "../lib/api";
import { updateProfile, uploadMyAvatar } from "../lib/api/auth";
import { formatDate, employeeTypeLabel } from "../lib/format";
import { useToast } from "../toast";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  if (!user) return null;

  async function uploadAvatar(file: File) {
    try {
      const updated = await uploadMyAvatar(file);
      updateUser(updated);
      toast.success("Photo updated.");
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "Photo could not be uploaded.");
    }
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setNameError("");
    setSavingName(true);
    try {
      const updated = await updateProfile(name.trim());
      updateUser(updated);
      setProfileDialogOpen(false);
      toast.success("Profile updated.");
    } catch (reason) {
      setNameError(reason instanceof ApiError ? reason.message : "Profile could not be updated.");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-7">
      <PageHeader className="mb-8 px-1" title="My Profile" description="Manage your account details and login credentials." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <section className="surface-panel flex flex-col items-center gap-4 p-8 text-center">
          <EditableAvatar src={avatarSrc(user.avatarUrl)} alt={user.name} size="xl" onUpload={uploadAvatar} />
          <div>
            <h2 className="text-heading font-semibold text-on-surface">{user.name}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{user.email}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{employeeTypeLabel(user.role)}</span>
          <div className="mt-2 flex w-full items-center justify-center gap-2 border-t border-outline-variant/30 pt-4 text-xs text-on-surface-variant">
            <Icon className="text-[16px]">calendar_today</Icon>
            Member since {formatDate(user.createdAt)}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="surface-panel p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionHeading><Icon className="text-primary">badge</Icon>Account details</SectionHeading>
              <Button variant="secondary" size="sm" onClick={() => { setName(user.name); setNameError(""); setProfileDialogOpen(true); }}><Icon className="text-[16px]">edit</Icon>Edit</Button>
            </div>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-wider text-on-surface-variant">Full name</dt><dd className="mt-1.5 text-sm text-on-surface">{user.name}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-on-surface-variant">Work email</dt><dd className="mt-1.5 text-sm text-on-surface">{user.email}</dd></div>
            </dl>
          </section>

          <section className="surface-panel p-6">
            <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">lock</Icon>Security</SectionHeading>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant">Update the password used to sign in to the portal.</p>
              <Button variant="secondary" onClick={() => setPasswordDialogOpen(true)}>
                <Icon className="text-[16px]">lock_reset</Icon>
                Change password
              </Button>
            </div>
          </section>
        </div>
      </div>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
      <FormDialog
        open={profileDialogOpen}
        title="Edit profile"
        description="Update the name shown across the portal."
        icon="badge"
        submitLabel="Save changes"
        submitting={savingName}
        submitDisabled={!name.trim() || name.trim() === user.name}
        error={nameError}
        onSubmit={saveName}
        onClose={() => { setProfileDialogOpen(false); setName(user.name); setNameError(""); }}
      >
        <FormField label="Full name"><Input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} autoFocus /></FormField>
        <FormField label="Work email" hint="Contact a core member to change your email."><Input value={user.email} disabled className="opacity-60" /></FormField>
      </FormDialog>
    </div>
  );
}
