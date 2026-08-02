export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
export type EmployeeType = "EXECUTIVE" | "EMPLOYEE" | "CONTRACTOR" | "INTERN";
/** User.role reuses EmployeeType: EXECUTIVE (core member) has elevated access. */
export type UserRole = EmployeeType;
export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type ProjectType = "MONTHLY_RECURRING" | "FIXED" | "HOURLY";
export type ProjectPaymentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PARTIALLY_PAID"
  | "FULLY_PAID"
  | "OVERDUE";
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type PayrollEntryStatus = "PENDING" | "PAID";
export type ExpenseType = "ONE_TIME" | "MONTHLY_RECURRING";
export type ExpenseFrequency = "MONTHLY";
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
  avatarUrl: string | null;
  createdAt: string;
}

export interface NamedOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Organization {
  id: number;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  defaultCurrency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPayload {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  defaultCurrency: string;
  timezone: string;
}

export interface Salary {
  id: number;
  baseAmount: number;
  currency: string;
  effectiveDate: string;
  reason: string;
}

export interface EmployeeIdentifier {
  code: string;
  employeeType: EmployeeType;
  issuedAt: string;
  retiredAt?: string;
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
  employeeCode?: string;
  designationId: number;
  designation?: NamedOption;
  joiningDate: string;
  currentSalary?: Salary;
  identifierHistory: EmployeeIdentifier[];
  avatarUrl: string | null;
  createdAt: string;
}

export type EmployeePayload = Omit<
  Employee,
  | "id"
  | "fullName"
  | "employeeCode"
  | "department"
  | "designation"
  | "currentSalary"
  | "identifierHistory"
  | "avatarUrl"
  | "createdAt"
> & {
  baseAmount?: number;
  currency?: string;
};

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  applicationLink: string | null;
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
  designationId: number;
  baseAmount: number;
  currency: string;
}

export interface ProjectMilestone {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  paidDate: string | null;
}

export interface ProjectPayment {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
  notes: string | null;
}

export interface Project {
  id: number;
  name: string;
  clientName: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  monthlyAmount: number | null;
  billingDay: number | null;
  autoRenew: boolean | null;
  contractValue: number | null;
  hourlyRate: number | null;
  estimatedHours: number | null;
  loggedHours: number | null;
  milestones: ProjectMilestone[];
  payments: ProjectPayment[];
  totalReceived: number;
  outstandingBalance: number;
  paymentStatus: ProjectPaymentStatus;
}

export type ProjectPayload = Omit<
  Project,
  "id" | "payments" | "totalReceived" | "outstandingBalance" | "paymentStatus" | "milestones"
> & {
  milestones: Omit<ProjectMilestone, "id">[];
};

export type ProjectPaymentPayload = Omit<ProjectPayment, "id">;

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

export interface FinanceIncome {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  currency: string;
  expenseType: ExpenseType;
  frequency: ExpenseFrequency | null;
  date: string;
  notes: string | null;
}

export type ExpensePayload = Omit<Expense, "id">;

export interface FinanceTransaction {
  id: string;
  kind: "INCOME" | "EXPENSE" | "PAYROLL";
  date: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
}

export interface FinanceOverview {
  totalIncome: number;
  totalExpenses: number;
  payrollTotal: number;
  netCashFlow: number;
  recentTransactions: FinanceTransaction[];
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
