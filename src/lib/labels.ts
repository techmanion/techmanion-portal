/** Human-facing labels for enum values (design-doc §Clarity: plain terms). */

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

export const SALARY_REASON_LABELS: Record<string, string> = {
  HIRE: "Hire",
  RAISE: "Raise",
  PROMOTION: "Promotion",
  RATE_CHANGE: "Rate change",
  CORRECTION: "Correction",
};

export const EMPLOYEE_STATUSES = [
  "ACTIVE",
  "ON_LEAVE",
  "RESIGNED",
  "TERMINATED",
] as const;
