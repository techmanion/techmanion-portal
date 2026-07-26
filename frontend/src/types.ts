export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
export type EmployeeType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID";

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
  cnic: string;
  dateOfBirth?: string;
  email: string;
  phone: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employeeType: EmployeeType;
  status: EmployeeStatus;
  compensationType: "FIXED";
  departmentId?: number;
  designationId?: number;
  department?: NamedOption;
  designation?: NamedOption;
  joiningDate: string;
  probationEndDate?: string;
  confirmationDate?: string;
  accessLog?: string;
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

export interface Assignment {
  id: number;
  employeeId: number;
  employeeName: string;
  projectRole: string;
  allocationPct: number;
}

export interface Project {
  id: number;
  name: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  contractValue: number;
  currency: string;
  trelloUrl?: string;
  assignments: Assignment[];
}

export interface Payslip {
  id: number;
  employeeId: number;
  employeeName: string;
  baseAmount: number;
  currency: string;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
}

export interface PayrollRun {
  id: number;
  periodMonth: string;
  status: "DRAFT" | "COMPLETED";
  payslips: Payslip[];
}

export interface TaxSlab {
  id: number;
  fiscalYear: string;
  lowerBound: number;
  upperBound?: number;
  fixedAmount: number;
  rateBpsOverLower: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: number;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export interface EmployeeDocument {
  id: number;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}
