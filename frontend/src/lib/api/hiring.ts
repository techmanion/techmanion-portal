import type {
  Candidate,
  CandidatePayload,
  ConvertToEmployeePayload,
  Employee,
  Job,
  JobPayload,
} from "../../types";
import { api } from "./client";

export function listJobs(query = "") {
  return api<Job[]>(`/admin/jobs${query ? `?${query}` : ""}`);
}

export function getJob(jobId: string | number) {
  return api<Job>(`/admin/jobs/${jobId}`);
}

export function createJob(payload: JobPayload) {
  return api<Job>("/admin/jobs", { method: "POST", body: JSON.stringify(payload) });
}

export function updateJob(jobId: number, payload: JobPayload) {
  return api<Job>(`/admin/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteJob(jobId: number) {
  return api<void>(`/admin/jobs/${jobId}`, { method: "DELETE" });
}

export function listCandidates(query: string) {
  return api<Candidate[]>(`/admin/candidates?${query}`);
}

export function getCandidate(candidateId: string | number) {
  return api<Candidate>(`/admin/candidates/${candidateId}`);
}

export function createCandidate(payload: CandidatePayload) {
  return api<Candidate>("/admin/candidates", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCandidate(candidateId: number, payload: CandidatePayload) {
  return api<Candidate>(`/admin/candidates/${candidateId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateCandidateStage(candidateId: number, stage: Candidate["stage"]) {
  return api<Candidate>(`/admin/candidates/${candidateId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
}

export function deleteCandidate(candidateId: number) {
  return api<void>(`/admin/candidates/${candidateId}`, { method: "DELETE" });
}

export function convertCandidate(candidateId: number, payload: ConvertToEmployeePayload) {
  return api<Employee>(`/admin/candidates/${candidateId}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
