import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, IconButton, Input, Select, StatusChip } from "../components/atoms";
import { EmployeeCell, EmptyState, FormField } from "../components/molecules";
import { DataTable, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { api, ApiError } from "../lib/api";
import { formatDate, roleLabel } from "../lib/format";
import type { User, UserRole } from "../types";

const roles: UserRole[] = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];

export function TeamPage() {
  const { user: currentUser, updateUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "HR" as UserRole });

  function load() {
    setLoading(true);
    api<User[]>("/users")
      .then(setMembers)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createMember(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api<User>("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "HR" });
      setShowForm(false);
      load();
    } catch (reason) {
      setFormError(reason instanceof ApiError ? reason.message : "Team member could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member: User) {
    setError("");
    try {
      const updated = await api<User>(`/users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not update this member.");
    }
  }

  async function changeRole(member: User, role: UserRole) {
    setError("");
    try {
      const updated = await api<User>(`/users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      if (currentUser?.id === updated.id) updateUser(updated);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not update this member.");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Team members"
        meta={
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {members.length.toLocaleString()} Total
          </span>
        }
        description="Create and manage the portal login accounts for your admin and HR staff."
        actions={
          !showForm ? (
            <Button size="lg" onClick={() => setShowForm(true)}>
              <Icon className="text-[18px]">person_add</Icon>
              Add member
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4" onSubmit={createMember}>
          <FormField label="Full name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </FormField>
          <FormField label="Work email">
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </FormField>
          <FormField label="Temporary password" hint="At least 8 characters.">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={8}
              required
            />
          </FormField>
          <FormField label="Role">
            <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
              {roles.map((role) => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </Select>
          </FormField>
          {formError && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error md:col-span-2 xl:col-span-4">{formError}</div>}
          <div className="flex gap-2.5 md:col-span-2 xl:col-span-4">
            <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create account"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <section className="surface-panel overflow-hidden">
        <DataTable minWidth="820px">
          <thead>
            <TableHeadRow>
              <th className="px-6 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="w-16 px-4 py-3" />
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {members.map((member) => (
              <TableRow key={member.id}>
                <td className="px-6">
                  <EmployeeCell name={member.name} subtitle={member.email} />
                </td>
                <td className="px-4">
                  <Select
                    aria-label={`Role for ${member.name}`}
                    value={member.role}
                    disabled={member.id === currentUser?.id}
                    onChange={(event) => changeRole(member, event.target.value as UserRole)}
                    className="!h-9 w-40"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{roleLabel(role)}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-4">
                  <StatusChip value={member.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-4 text-sm text-on-surface-variant">{formatDate(member.createdAt)}</td>
                <td className="px-4">
                  {member.id !== currentUser?.id && (
                    <IconButton
                      size="sm"
                      aria-label={member.isActive ? `Deactivate ${member.name}` : `Activate ${member.name}`}
                      title={member.isActive ? "Deactivate" : "Activate"}
                      onClick={() => toggleActive(member)}
                    >
                      <Icon className="text-[18px]">{member.isActive ? "block" : "check_circle"}</Icon>
                    </IconButton>
                  )}
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
        {!loading && !members.length && <EmptyState>No team members yet.</EmptyState>}
        {error && <div className="px-6 py-4"><div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div></div>}
      </section>
    </div>
  );
}
