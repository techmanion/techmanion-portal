import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Loading } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { Breadcrumb, ConfirmDialog, EmptyState } from "../components/molecules";
import { ProjectInfoPanel, ProjectTeamPanel } from "../components/organisms";
import { listEmployees } from "../lib/api/employees";
import {
  assignEmployeeToProject,
  deleteProject,
  getProject,
  unassignEmployeeFromProject,
} from "../lib/api/projects";
import { useToast } from "../toast";
import type { Employee, Project } from "../types";

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  function load() {
    getProject(projectId!)
      .then(setProject)
      .catch((reason: Error) => setError(reason.message));
    listEmployees("").then(setEmployees).catch(() => undefined);
  }

  useEffect(load, [projectId]);

  const isAdmin = user?.role === "ADMIN";

  async function removeProject() {
    setConfirmDelete(false);
    try {
      await deleteProject(projectId!);
      navigate("/projects");
      toast.success("Project deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be deleted.");
    }
  }

  async function assign(employeeId: number) {
    try {
      await assignEmployeeToProject(projectId!, employeeId);
      load();
      toast.success("Employee assigned.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be assigned.");
    }
  }

  async function unassign(assignmentId: number) {
    try {
      await unassignEmployeeFromProject(projectId!, assignmentId);
      load();
      toast.success("Employee removed from project.");
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
      <Breadcrumb to="/projects" trail={["Projects", project.name]} />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{project.clientName}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip value={project.status} />
          {isAdmin && (
            <Link
              to={`/projects/${project.id}/edit`}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"
            >
              <Icon className="text-[16px]">edit</Icon>
              Edit
            </Link>
          )}
          {isAdmin && (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Icon className="text-[16px]">delete</Icon>
              Delete
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this project?"
        description={`"${project.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={removeProject}
        onCancel={() => setConfirmDelete(false)}
      />

      <ProjectInfoPanel project={project} />

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
