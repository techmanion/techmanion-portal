import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { Icon, IconButton, Loading, Select, StatusChip } from "../components/atoms";
import { EmployeeCell, EmptyState } from "../components/molecules";
import { DataTable, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { ApiError } from "../lib/api";
import { listUsers, updateUser as updateUserRequest } from "../lib/api/users";
import { formatDate, roleLabel } from "../lib/format";
import { USER_ROLES } from "../lib/options";
import { useToast } from "../toast";
import type { User, UserRole } from "../types";

const roles = USER_ROLES;

export function TeamPage() {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    listUsers()
      .then(setMembers)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(member: User) {
    setError("");
    try {
      const updated = await updateUserRequest(member.id, { isActive: !member.isActive });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(updated.isActive ? `${updated.name} activated.` : `${updated.name} deactivated.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not update this member.");
    }
  }

  async function changeRole(member: User, role: UserRole) {
    setError("");
    try {
      const updated = await updateUserRequest(member.id, { role });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      if (currentUser?.id === updated.id) setCurrentUser(updated);
      toast.success(`${updated.name}'s role updated to ${roleLabel(updated.role)}.`);
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
          <Link
            to="/team/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"
          >
            <Icon className="text-[18px]">person_add</Icon>
            Add member
          </Link>
        }
      />

      <section className="surface-panel overflow-hidden">
        {loading ? (
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        ) : (
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
        )}
        {!loading && !members.length && <EmptyState>No team members yet.</EmptyState>}
        {error && <div className="px-6 py-4"><div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div></div>}
      </section>
    </div>
  );
}
