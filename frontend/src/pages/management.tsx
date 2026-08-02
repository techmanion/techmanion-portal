import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, Input, Loading, Select, StatusChip } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmployeeCell, FormDialog, FormField } from "../components/molecules";
import { DataTable, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { ApiError, avatarSrc } from "../lib/api";
import { listEmployees } from "../lib/api/employees";
import { addDepartment, addDesignation, listDepartments, listDesignations } from "../lib/api/settings";
import { createUser, listUsers } from "../lib/api/users";
import { formatDate } from "../lib/format";
import { useToast } from "../toast";
import type { Employee, NamedOption, User } from "../types";

const emptyMemberForm = { employeeId: 0, email: "", password: "" };

export function ManagementPage() {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [optionKind, setOptionKind] = useState<"departments" | "designations" | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [error, setError] = useState("");

  const [members, setMembers] = useState<User[]>([]);
  const [coreMembers, setCoreMembers] = useState<Employee[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [creatingMember, setCreatingMember] = useState(false);

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
    Promise.all([listUsers(), listEmployees("")])
      .then(([users, employees]) => {
        setMembers(users);
        setCoreMembers(employees.filter((employee) => employee.employeeType === "EXECUTIVE"));
      })
      .catch((reason: Error) => setMembersError(reason.message));
  }

  useEffect(() => {
    Promise.all([listUsers(), listEmployees("")])
      .then(([users, employees]) => {
        setMembers(users);
        setCoreMembers(employees.filter((employee) => employee.employeeType === "EXECUTIVE"));
      })
      .catch((reason: Error) => setMembersError(reason.message))
      .finally(() => setLoadingMembers(false));
  }, []);

  const availableCoreMembers = useMemo(
    () => coreMembers.filter((employee) => !members.some((member) => member.employeeId === employee.id)),
    [coreMembers, members],
  );

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
      toast.success("Account created.");
      setMemberForm(emptyMemberForm);
      setShowAddMember(false);
      refreshMembers();
    } catch (reason) {
      setMembersError(reason instanceof ApiError ? reason.message : "Account could not be created.");
    } finally {
      setCreatingMember(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-8">
      <PageHeader
        className="mb-8 px-1"
        title="Management"
        description="Manage portal access and the departments and designations behind employee records."
      />

      <section className="surface-panel mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-6">
          <SectionHeading>
            <Icon className="text-primary">workspace_premium</Icon>
            Portal accounts
          </SectionHeading>
          {availableCoreMembers.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => { setMemberForm({ ...emptyMemberForm, employeeId: availableCoreMembers[0].id }); setMembersError(""); setShowAddMember(true); }}>
              <Icon className="text-[16px]">person_add</Icon>
              Add member
            </Button>
          )}
        </div>

        {loadingMembers ? (
          <div className="grid min-h-32 place-items-center">
            <Loading />
          </div>
        ) : (
          <DataTable minWidth="720px">
            <thead>
              <TableHeadRow>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </TableHeadRow>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {members.map((member) => (
                <TableRow key={member.id}>
                  <td className="px-6">
                    <EmployeeCell name={member.name} subtitle={member.email} avatarSrc={avatarSrc(member.avatarUrl)} />
                  </td>
                  <td className="px-4 text-sm text-on-surface">{member.employeeCode ?? "—"}</td>
                  <td className="px-4">
                    <StatusChip value={member.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-4 text-sm text-on-surface-variant">{formatDate(member.createdAt)}</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
        {!loadingMembers && !members.length && (
          <div className="px-6 py-8 text-center text-sm text-on-surface-variant">No portal accounts yet.</div>
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
          {currentUser?.role === "EXECUTIVE" && <Button variant="secondary" size="sm" onClick={() => { setDepartment(""); setError(""); setOptionKind("departments"); }}><Icon className="text-[16px]">add</Icon>Add department</Button>}
        </section>
        <section className="surface-panel p-6">
          <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">badge</Icon>Designations</SectionHeading>
          <ul className="mb-6 divide-y divide-outline-variant/30">{designations.map((item) => <li className="py-3 text-sm" key={item.id}>{item.name}</li>)}</ul>
          {currentUser?.role === "EXECUTIVE" && <Button variant="secondary" size="sm" onClick={() => { setDesignation(""); setError(""); setOptionKind("designations"); }}><Icon className="text-[16px]">add</Icon>Add designation</Button>}
        </section>
      </div>
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      <FormDialog
        open={showAddMember}
        title="Add member"
        description="Grant portal access to a core member. They must already exist as an employee record."
        icon="person_add"
        width="lg"
        submitLabel="Create account"
        submittingLabel="Creating…"
        submitting={creatingMember}
        submitDisabled={!memberForm.employeeId || !memberForm.email.trim() || memberForm.password.length < 8}
        error={membersError}
        onSubmit={createMember}
        onClose={() => { setShowAddMember(false); setMemberForm(emptyMemberForm); setMembersError(""); }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Core member" className="md:col-span-2">
            <Select
              value={memberForm.employeeId}
              onChange={(event) => setMemberForm((current) => ({ ...current, employeeId: Number(event.target.value) }))}
              required
              autoFocus
            >
              {availableCoreMembers.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} {employee.employeeCode ? `(${employee.employeeCode})` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Work email"><Input type="email" value={memberForm.email} onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))} required /></FormField>
          <FormField label="Temporary password" hint="At least 8 characters."><Input type="password" autoComplete="new-password" value={memberForm.password} onChange={(event) => setMemberForm((current) => ({ ...current, password: event.target.value }))} minLength={8} required /></FormField>
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
    </div>
  );
}
