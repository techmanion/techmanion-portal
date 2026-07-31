import type { Project, ProjectPayload, ProjectPaymentPayload } from "../../types";
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

export function addProjectPayment(projectId: string | number, payload: ProjectPaymentPayload) {
  return api<Project>(`/projects/${projectId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteProjectPayment(projectId: string | number, paymentId: number) {
  return api<Project>(`/projects/${projectId}/payments/${paymentId}`, { method: "DELETE" });
}
