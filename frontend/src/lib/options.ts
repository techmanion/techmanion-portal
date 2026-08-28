import type {
  CandidateStage,
  Currency,
  EmployeeStatus,
  EmployeeType,
  ExpenseType,
  InventoryCategory,
  InventoryCondition,
  InventoryStatus,
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
export const PROJECT_CURRENCIES: Currency[] = ["PKR", "USD", "EUR", "GBP"];

export const JOB_STATUSES: JobStatus[] = ["OPEN", "CLOSED"];

export const CANDIDATE_STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  "LAPTOP",
  "MONITOR",
  "KEYBOARD",
  "MOUSE",
  "CHAIR",
  "DESK",
  "HEADSET",
  "PHONE",
  "CABLE",
  "OTHER",
];

export const INVENTORY_STATUSES: InventoryStatus[] = [
  "AVAILABLE",
  "IN_USE",
  "IN_REPAIR",
  "RETIRED",
];

export const INVENTORY_CONDITIONS: InventoryCondition[] = ["NEW", "GOOD", "FAIR", "POOR"];

export const INVENTORY_CATEGORY_ICONS: Record<InventoryCategory, string> = {
  LAPTOP: "laptop_mac",
  MONITOR: "desktop_windows",
  KEYBOARD: "keyboard",
  MOUSE: "mouse",
  CHAIR: "chair",
  DESK: "table_restaurant",
  HEADSET: "headset_mic",
  PHONE: "smartphone",
  CABLE: "cable",
  OTHER: "category",
};

export const DOCUMENT_KINDS = ["CV", "CONTRACT", "ID_COPY", "CERTIFICATE", "OTHER"];

export const ACTIVITY_ENTITY_TYPES = [
  "Project",
  "ProjectPayment",
  "Expense",
  "PayrollEntry",
  "BankAccount",
  "BankTransaction",
  "BankTransfer",
  "Employee",
  "Candidate",
  "Job",
  "Organization",
  "InventoryItem",
];

export const ACTIVITY_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PAID",
  "HIRED",
  "ACTIVATE",
  "DEACTIVATE",
];

export const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR", "CAD", "AUD"];

const supportedTimezones: string[] =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "Asia/Karachi", "Asia/Dubai", "Europe/London", "America/New_York"];

export const TIMEZONES = ["UTC", ...supportedTimezones.filter((zone) => zone !== "UTC")];
