import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, IconButton, Input, Loading, Select, StatusChip } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { ConfirmDialog, EmployeeCell, FormDialog, FormField } from "../components/molecules";
import { DataTable, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { ApiError } from "../lib/api";
import { addDepartment, addDesignation, listDepartments, listDesignations } from "../lib/api/settings";
import { createUser, deleteUser, listUsers, updateUser as updateUserRequest } from "../lib/api/users";
import { formatDate, roleLabel } from "../lib/format";
import { USER_ROLES } from "../lib/options";
import { useToast } from "../toast";
import type { NamedOption, User, UserRole } from "../types";

const emptyMemberForm = { name: "", email: "", password: "", role: "HR" as UserRole };

export function AdministrationPage() {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [optionKind, setOptionKind] = useState<"departments" | "designations" | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [error, setError] = useState("");

  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [creatingMember, setCreatingMember] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const toast = useToast();

  function load() {
    Promise.all([listDepartments(), listDesignations()])
      .then(([departmentRows, designationRows]) => {
        setDepartments(departmentRows);
        setDesignations(designationRows);
      })
      .catch(() => undefined);
  }
  useEffect(load, [currentUser?.role]);

  function refreshMembers() {
    listUsers()
      .then(setMembers)
      .catch((reason: Error) => setMembersError(reason.message));
  }

  useEffect(() => {
    listUsers()
      .then(setMembers)
      .catch((reason: Error) => setMembersError(reason.message))
      .finally(() => setLoadingMembers(false));
  }, []);

  async function add(kind: "departments" | "designations", name: string) {
    setAddingOption(true);
    setError("");
    try {
      if (kind === "departments") {
        await addDepartment(name);
        setDepartment("");
        toast.success("Department added.");
      } else {
        await addDesignation(name);
        setDesignation("");
        toast.success("Designation added.");
      }
      load();
      setOptionKind(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Organization list could not be updated.");
    } finally {
      setAddingOption(false);
    }
  }

  async function createMember(event: React.FormEvent) {
    event.preventDefault();
    setCreatingMember(true);
    setMembersError("");
    try {
      await createUser(memberForm);
      toast.success("Administrator account created.");
      setMemberForm(emptyMemberForm);
      setShowAddMember(false);
      refreshMembers();
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Account could not be created.");
    } finally {
      setCreatingMember(false);
    }
  }

  async function changeRole(member: User, role: UserRole) {
    setMembersError("");
    try {
      const updated = await updateUserRequest(member.id, { role });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      if (currentUser?.id === updated.id) setCurrentUser(updated);
      toast.success(`${updated.name}'s role updated to ${roleLabel(updated.role)}.`);
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Could not update this account.");
    }
  }

  async function reactivate(member: User) {
    setMembersError("");
    try {
      const updated = await updateUserRequest(member.id, { isActive: true });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(`${updated.name} reactivated.`);
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Could not update this account.");
    }
  }

  async function confirmDeactivateMember() {
    if (!confirmDeactivate) return;
    const member = confirmDeactivate;
    setConfirmDeactivate(null);
    setMembersError("");
    try {
      const updated = await updateUserRequest(member.id, { isActive: false });
      setMembers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(`${updated.name} deactivated.`);
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Could not deactivate this account.");
    }
  }

  async function confirmDeleteMember() {
    if (!confirmDelete) return;
    const member = confirmDelete;
    setConfirmDelete(null);
    setMembersError("");
    try {
      await deleteUser(member.id);
      setMembers((current) => current.filter((row) => row.id !== member.id));
      toast.success(`${member.name} removed.`);
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Could not delete this account.");
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-8">
      <PageHeader
        className="mb-8 px-1"
        title="Administration"
        description="Manage portal access and the departments and designations behind employee records."
      />

      <section className="surface-panel mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-6">
          <SectionHeading>
            <Icon className="text-primary">admin_panel_settings</Icon>
            Administrators
          </SectionHeading>
          <Button variant="secondary" size="sm" onClick={() => { setMemberForm(emptyMemberForm); setMembersError(""); setShowAddMember(true); }}>
            <Icon className="text-[16px]">person_add</Icon>
            Add administrator
          </Button>
        </div>

        {loadingMembers ? (
          <div className="grid min-h-32 place-items-center">
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
                <th className="w-24 px-4 py-3" />
              </TableHeadRow>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {members.map((member) => {
                const isSelf = member.id === currentUser?.id;
                return (
                  <TableRow key={member.id}>
                    <td className="px-6">
                      <EmployeeCell name={member.name} subtitle={member.email} />
                    </td>
                    <td className="px-4">
                      <Select
                        aria-label={`Role for ${member.name}`}
                        value={member.role}
                        disabled={isSelf}
                        title={isSelf ? "You cannot change your own role." : undefined}
                        onChange={(event) => changeRole(member, event.target.value as UserRole)}
                        className="!h-9 w-40"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4">
                      <StatusChip value={member.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 text-sm text-on-surface-variant">{formatDate(member.createdAt)}</td>
                    <td className="px-4">
                      {!isSelf && (
                        <div className="flex items-center gap-1">
                          <IconButton
                            size="sm"
                            aria-label={member.isActive ? `Deactivate ${member.name}` : `Activate ${member.name}`}
                            title={member.isActive ? "Deactivate" : "Activate"}
                            onClick={() =>
                              member.isActive ? setConfirmDeactivate(member) : reactivate(member)
                            }
                          >
                            <Icon className="text-[18px]">{member.isActive ? "block" : "check_circle"}</Icon>
                          </IconButton>
                          <IconButton
                            size="sm"
                            aria-label={`Delete ${member.name}`}
                            title="Delete account"
                            onClick={() => setConfirmDelete(member)}
                          >
                            <Icon className="text-[18px] text-error">delete</Icon>
                          </IconButton>
                        </div>
                      )}
                    </td>
                  </TableRow>
                );
              })}
            </tbody>
          </DataTable>
        )}
        {!loadingMembers && !members.length && (
          <div className="px-6 py-8 text-center text-sm text-on-surface-variant">No administrator accounts yet.</div>
        )}
        {membersError && (
          <div className="px-6 py-4">
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{membersError}</div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-6">
          <SectionHeading className="mb-5"><Icon className="text-primary">hub</Icon>Departments</SectionHeading>
          <ul className="mb-6 divide-y divide-outline-variant/30">{departments.map((item) => <li className="py-3 text-sm" key={item.id}>{item.name}</li>)}</ul>
          {currentUser?.role === "ADMIN" && <Button variant="secondary" size="sm" onClick={() => { setDepartment(""); setError(""); setOptionKind("departments"); }}><Icon className="text-[16px]">add</Icon>Add department</Button>}
        </section>
        <section className="surface-panel p-6">
          <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">badge</Icon>Designations</SectionHeading>
          <ul className="mb-6 divide-y divide-outline-variant/30">{designations.map((item) => <li className="py-3 text-sm" key={item.id}>{item.name}</li>)}</ul>
          {currentUser?.role === "ADMIN" && <Button variant="secondary" size="sm" onClick={() => { setDesignation(""); setError(""); setOptionKind("designations"); }}><Icon className="text-[16px]">add</Icon>Add designation</Button>}
        </section>
      </div>
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      <FormDialog
        open={showAddMember}
        title="Add administrator"
        description="Create an account with access to the portal."
        icon="person_add"
        width="lg"
        submitLabel="Create account"
        submittingLabel="Creating…"
        submitting={creatingMember}
        submitDisabled={!memberForm.name.trim() || !memberForm.email.trim() || memberForm.password.length < 8}
        error={membersError}
        onSubmit={createMember}
        onClose={() => { setShowAddMember(false); setMemberForm(emptyMemberForm); setMembersError(""); }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full name"><Input value={memberForm.name} onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))} required autoFocus /></FormField>
          <FormField label="Work email"><Input type="email" value={memberForm.email} onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))} required /></FormField>
          <FormField label="Temporary password" hint="At least 8 characters."><Input type="password" autoComplete="new-password" value={memberForm.password} onChange={(event) => setMemberForm((current) => ({ ...current, password: event.target.value }))} minLength={8} required /></FormField>
          <FormField label="Role"><Select value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value as UserRole }))}>{USER_ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</Select></FormField>
        </div>
      </FormDialog>

      <FormDialog
        open={optionKind !== null}
        title={optionKind === "departments" ? "Add department" : "Add designation"}
        description={optionKind === "departments" ? "Create a department for organization and employee records." : "Create a designation for employee records."}
        icon={optionKind === "departments" ? "hub" : "badge"}
        submitLabel="Add"
        submittingLabel="Adding…"
        submitting={addingOption}
        submitDisabled={!(optionKind === "departments" ? department : designation).trim()}
        error={error}
        onSubmit={(event) => {
          event.preventDefault();
          if (optionKind) void add(optionKind, optionKind === "departments" ? department.trim() : designation.trim());
        }}
        onClose={() => { setOptionKind(null); setDepartment(""); setDesignation(""); setError(""); }}
      >
        <FormField label={optionKind === "departments" ? "Department name" : "Designation name"}>
          <Input
            value={optionKind === "departments" ? department : designation}
            onChange={(event) => optionKind === "departments" ? setDepartment(event.target.value) : setDesignation(event.target.value)}
            required
            autoFocus
          />
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={confirmDeactivate !== null}
        title="Deactivate this account?"
        description={
          confirmDeactivate
            ? `${confirmDeactivate.name} will immediately lose access to the portal. You can reactivate the account later.`
            : undefined
        }
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivateMember}
        onCancel={() => setConfirmDeactivate(null)}
      />
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this account?"
        description={
          confirmDelete
            ? `"${confirmDelete.name}" will be permanently removed and cannot be recovered.`
            : undefined
        }
        confirmLabel="Delete account"
        onConfirm={confirmDeleteMember}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
