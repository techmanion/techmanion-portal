import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Avatar, Button, Icon, IconButton, Input, Loading, Select, StatusChip, Textarea } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState, FormField } from "../components/molecules";
import { api } from "../lib/api";
import { formatDate, label } from "../lib/format";
import type { Employee, Project, ProjectStatus } from "../types";

const statuses: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"];

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    status: "PLANNED" as ProjectStatus,
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [error, setError] = useState("");

  function load() {
    api<Project>(`/projects/${projectId}`)
      .then((row) => {
        setProject(row);
        setForm({
          name: row.name,
          clientName: row.clientName,
          status: row.status,
          startDate: row.startDate.slice(0, 10),
          endDate: row.endDate ? row.endDate.slice(0, 10) : "",
          notes: row.notes ?? "",
        });
      })
      .catch((reason: Error) => setError(reason.message));
    api<Employee[]>("/employees").then(setEmployees).catch(() => undefined);
  }

  useEffect(load, [projectId]);

  const isAdmin = user?.role === "ADMIN";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, endDate: form.endDate || null, notes: form.notes || null }),
      });
      setEditing(false);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be saved.");
    }
  }

  async function removeProject() {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api(`/projects/${projectId}`, { method: "DELETE" });
      navigate("/projects");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be deleted.");
    }
  }

  async function assign(employeeId: string) {
    if (!employeeId) return;
    try {
      await api(`/projects/${projectId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ employeeId: Number(employeeId) }),
      });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be assigned.");
    }
  }

  async function unassign(assignmentId: number) {
    try {
      await api(`/projects/${projectId}/assignments/${assignmentId}`, { method: "DELETE" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be removed.");
    }
  }

  if (!project && !error) {
    return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  }
  if (!project) {
    return <div className="p-6"><EmptyState>{error}</EmptyState></div>;
  }

  const unassigned = employees.filter(
    (employee) => !project.assignments.some((row) => row.employeeId === employee.id),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-7">
      <Link
        to="/projects"
        className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-on-surface-variant hover:text-primary"
      >
        <Icon className="text-[18px]">arrow_back</Icon>
        Projects / {project.name}
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{project.clientName}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip value={project.status} />
          {isAdmin && !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Icon className="text-[16px]">edit</Icon>
              Edit
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" onClick={removeProject}>
              <Icon className="text-[16px]">delete</Icon>
              Delete
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="surface-panel mb-8 grid gap-4 p-6 md:grid-cols-2">
          <FormField label="Project name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></FormField>
          <FormField label="Client"><Input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required /></FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>
              {statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </Select>
          </FormField>
          <FormField label="Start date"><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></FormField>
          <FormField label="Target end date"><Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></FormField>
          <FormField label="Notes" className="md:col-span-2"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField>
          <div className="flex gap-2.5 md:col-span-2">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <section className="surface-panel mb-8 p-6">
          <SectionHeading className="mb-6">Project Information</SectionHeading>
          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <div>
              <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">Start date</dt>
              <dd className="text-sm text-on-surface">{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">Target end date</dt>
              <dd className="text-sm text-on-surface">{formatDate(project.endDate)}</dd>
            </div>
            {project.notes && (
              <div className="md:col-span-2">
                <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">Notes</dt>
                <dd className="text-sm leading-6 text-on-surface">{project.notes}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="surface-panel p-6">
        <div className="mb-6 flex items-center justify-between">
          <SectionHeading>Team Members</SectionHeading>
          {isAdmin && (
            <select
              aria-label="Assign employee"
              defaultValue=""
              onChange={(event) => {
                assign(event.target.value);
                event.target.value = "";
              }}
              className="h-9 rounded-full bg-surface-container-high px-3.5 text-sm text-on-surface outline-none"
            >
              <option value="">Assign member</option>
              {unassigned.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
            </select>
          )}
        </div>
        {project.assignments.length ? (
          <ul className="divide-y divide-outline-variant/30">
            {project.assignments.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar alt={row.employeeName} size="sm" />
                  <span className="text-sm font-medium text-on-surface">{row.employeeName}</span>
                </div>
                {isAdmin && (
                  <IconButton size="sm" aria-label={`Remove ${row.employeeName}`} onClick={() => unassign(row.id)}>
                    <Icon className="text-[18px]">close</Icon>
                  </IconButton>
                )}
              </li>
            ))}
          </ul>
        ) : <EmptyState>No team members assigned yet.</EmptyState>}
      </section>
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
