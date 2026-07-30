export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
export type EmployeeType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type PayrollEntryStatus = "PENDING" | "PAID";
export type JobStatus = "OPEN" | "CLOSED";
export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface NamedOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Salary {
  id: number;
  baseAmount: number;
  currency: string;
  effectiveDate: string;
  reason: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  employeeType: EmployeeType;
  status: EmployeeStatus;
  designationId?: number;
  designation?: NamedOption;
  joiningDate: string;
  currentSalary?: Salary;
  createdAt: string;
}

export type EmployeePayload = Omit<
  Employee,
  "id" | "fullName" | "department" | "designation" | "currentSalary" | "createdAt"
> & {
  baseAmount?: number;
  currency?: string;
};

export interface Job {
  id: number;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: string;
}

export type JobPayload = Omit<Job, "id" | "createdAt">;

export interface Candidate {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  jobId: number;
  jobTitle: string;
  stage: CandidateStage;
  resume?: string;
  interviewDate?: string;
  notes?: string;
  createdAt: string;
}

export type CandidatePayload = Omit<Candidate, "id" | "jobTitle" | "createdAt">;

export interface ConvertToEmployeePayload {
  employeeType: EmployeeType;
  joiningDate: string;
  designationId?: number;
  baseAmount: number;
  currency: string;
}

export interface Assignment {
  id: number;
  employeeId: number;
  employeeName: string;
}

export interface Project {
  id: number;
  name: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
  assignments: Assignment[];
}

export type ProjectPayload = Omit<Project, "id" | "assignments">;

export interface PayrollEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  month: string;
  baseCompensation: number;
  adjustment: number;
  finalAmount: number;
  currency: string;
  status: PayrollEntryStatus;
  paymentDate?: string;
  notes?: string;
}

export interface Activity {
  id: number;
  entity: string;
  entityId: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface HomeItem {
  kind: "INTERVIEW" | "JOINING" | "PROJECT_DEADLINE" | "PAYROLL";
  title: string;
  description: string;
  eventDate?: string;
  href: string;
}

export interface HomeData {
  needsAttention: HomeItem[];
  upcoming: HomeItem[];
  recentActivity: Activity[];
}

export interface EmployeeDocument {
  id: number;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}
