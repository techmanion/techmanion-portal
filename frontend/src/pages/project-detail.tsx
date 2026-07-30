import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Loading } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { EmptyState } from "../components/molecules";
import { ProjectFormPanel, ProjectInfoPanel, ProjectTeamPanel } from "../components/organisms";
import { listEmployees } from "../lib/api/employees";
import {
  assignEmployeeToProject,
  deleteProject,
  getProject,
  unassignEmployeeFromProject,
  updateProject,
} from "../lib/api/projects";
import type { Employee, Project, ProjectPayload } from "../types";

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProjectPayload>({
    name: "",
    clientName: "",
    status: "PLANNED",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [error, setError] = useState("");

  function load() {
    getProject(projectId!)
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
    listEmployees("").then(setEmployees).catch(() => undefined);
  }

  useEffect(load, [projectId]);

  const isAdmin = user?.role === "ADMIN";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateProject(projectId!, {
        ...form,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
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
      await deleteProject(projectId!);
      navigate("/projects");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be deleted.");
    }
  }

  async function assign(employeeId: number) {
    try {
      await assignEmployeeToProject(projectId!, employeeId);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be assigned.");
    }
  }

  async function unassign(assignmentId: number) {
    try {
      await unassignEmployeeFromProject(projectId!, assignmentId);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be removed.");
    }
  }

  if (!project && !error) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loading />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="p-6">
        <EmptyState>{error}</EmptyState>
      </div>
    );
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
        <ProjectFormPanel
          form={form}
          onChange={setForm}
          onSubmit={save}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
          className="mb-8 grid gap-4 p-6 md:grid-cols-2"
          fullWidthClassName="md:col-span-2"
        />
      ) : (
        <ProjectInfoPanel project={project} />
      )}

      <ProjectTeamPanel
        project={project}
        unassignedEmployees={unassigned}
        isAdmin={isAdmin}
        onAssign={assign}
        onUnassign={unassign}
      />
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
