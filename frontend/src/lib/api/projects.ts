import type { Project, ProjectPayload } from "../../types";
import { api } from "./client";

export function listProjects() {
  return api<Project[]>("/projects");
}

export function getProject(projectId: string | number) {
  return api<Project>(`/projects/${projectId}`);
}

export function createProject(payload: ProjectPayload) {
  return api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) });
}

export function updateProject(projectId: string | number, payload: ProjectPayload) {
  return api<Project>(`/projects/${projectId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteProject(projectId: string | number) {
  return api<void>(`/projects/${projectId}`, { method: "DELETE" });
}

export function assignEmployeeToProject(projectId: string | number, employeeId: number) {
  return api<Project>(`/projects/${projectId}/assignments`, {
    method: "POST",
    body: JSON.stringify({ employeeId }),
  });
}

export function unassignEmployeeFromProject(projectId: string | number, assignmentId: number) {
  return api<Project>(`/projects/${projectId}/assignments/${assignmentId}`, { method: "DELETE" });
}
