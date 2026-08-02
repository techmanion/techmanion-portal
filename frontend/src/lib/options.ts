import type {
  CandidateStage,
  EmployeeStatus,
  EmployeeType,
  ExpenseType,
  JobStatus,
  ProjectStatus,
  ProjectType,
  MilestoneStatus,
} from "../types";

export const EMPLOYEE_TYPES: EmployeeType[] = ["EXECUTIVE", "EMPLOYEE", "CONTRACTOR", "INTERN"];

export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "RESIGNED",
  "TERMINATED",
];

export const EXPENSE_TYPES: ExpenseType[] = ["ONE_TIME", "MONTHLY_RECURRING"];

export const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"];
export const PROJECT_TYPES: ProjectType[] = ["MONTHLY_RECURRING", "FIXED", "HOURLY"];
export const MILESTONE_STATUSES: MilestoneStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export const JOB_STATUSES: JobStatus[] = ["OPEN", "CLOSED"];

export const CANDIDATE_STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const DOCUMENT_KINDS = ["CV", "CONTRACT", "ID_COPY", "CERTIFICATE", "OTHER"];

export const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR", "CAD", "AUD"];

const supportedTimezones: string[] =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "Asia/Karachi", "Asia/Dubai", "Europe/London", "America/New_York"];

export const TIMEZONES = ["UTC", ...supportedTimezones.filter((zone) => zone !== "UTC")];
