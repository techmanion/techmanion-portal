import type {
  CandidateStage,
  EmployeeStatus,
  EmployeeType,
  JobStatus,
  ProjectStatus,
  UserRole,
} from "../types";

export const EMPLOYEE_TYPES: EmployeeType[] = ["FULL_TIME", "PART_TIME", "CONTRACT"];

export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "RESIGNED",
  "TERMINATED",
];

export const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"];

export const JOB_STATUSES: JobStatus[] = ["OPEN", "CLOSED"];

export const CANDIDATE_STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const USER_ROLES: UserRole[] = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];

export const DOCUMENT_KINDS = ["CV", "CONTRACT", "ID_COPY", "CERTIFICATE", "OTHER"];
