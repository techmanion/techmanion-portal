import type {
  Candidate,
  CandidatePayload,
  ConvertToEmployeePayload,
  Employee,
  Job,
  JobPayload,
} from "../../types";
import { api } from "./client";

export function listJobs() {
  return api<Job[]>("/jobs");
}

export function createJob(payload: JobPayload) {
  return api<Job>("/jobs", { method: "POST", body: JSON.stringify(payload) });
}

export function updateJob(jobId: number, payload: JobPayload) {
  return api<Job>(`/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteJob(jobId: number) {
  return api<void>(`/jobs/${jobId}`, { method: "DELETE" });
}

export function listCandidates(query: string) {
  return api<Candidate[]>(`/candidates?${query}`);
}

export function createCandidate(payload: CandidatePayload) {
  return api<Candidate>("/candidates", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCandidate(candidateId: number, payload: CandidatePayload) {
  return api<Candidate>(`/candidates/${candidateId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCandidate(candidateId: number) {
  return api<void>(`/candidates/${candidateId}`, { method: "DELETE" });
}

export function convertCandidate(candidateId: number, payload: ConvertToEmployeePayload) {
  return api<Employee>(`/candidates/${candidateId}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
