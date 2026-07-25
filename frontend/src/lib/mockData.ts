/**
 * Dummy data + offline-mode switch for techmanion-portal.
 *
 * Flip BACKEND_DISABLED to false (and point VITE_API_URL at a real backend)
 * to reconnect. Everything the frontend needs while offline — records,
 * the login account, and the flag itself — lives in this one file, and the
 * in-memory mock API that serves it lives in mockApi.ts. Delete both files
 * and the `BACKEND_DISABLED` branches in lib/api.ts to remove this entirely.
 */
import type {
  AuditLog,
  Employee,
  NamedOption,
  PayrollRun,
  Project,
  TaxSlab,
  User,
} from "../types";

export const BACKEND_DISABLED = true;

export const mockCredentials = {
  email: "admin@techmanion.com",
  password: "12345678",
};

export const mockUser: User = {
  id: 1,
  email: mockCredentials.email,
  name: "Admin User",
  role: "ADMIN",
};

export const mockDepartments: NamedOption[] = [
  { id: 1, name: "Engineering", isActive: true },
  { id: 2, name: "Design", isActive: true },
  { id: 3, name: "Product", isActive: true },
];

export const mockDesignations: NamedOption[] = [
  { id: 1, name: "Software Engineer", isActive: true },
  { id: 2, name: "Senior Software Engineer", isActive: true },
  { id: 3, name: "Product Designer", isActive: true },
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    firstName: "Ayesha",
    lastName: "Khan",
    fullName: "Ayesha Khan",
    cnic: "35202-1000000-1",
    email: "ayesha.khan@techmanion.com",
    phone: "+92 300 1000000",
    employeeType: "FULL_TIME",
    status: "ACTIVE",
    compensationType: "FIXED",
    departmentId: 1,
    designationId: 2,
    department: mockDepartments[0],
    designation: mockDesignations[1],
    joiningDate: "2023-01-15",
    currentSalary: { id: 1, baseAmount: 15000000, currency: "PKR", effectiveDate: "2023-01-15", reason: "Joining salary" },
    createdAt: "2023-01-15T09:00:00Z",
  },
  {
    id: 2,
    firstName: "Hamza",
    lastName: "Siddiqui",
    fullName: "Hamza Siddiqui",
    cnic: "35202-1000137-1",
    email: "hamza.siddiqui@techmanion.com",
    phone: "+92 300 1001111",
    employeeType: "FULL_TIME",
    status: "ACTIVE",
    compensationType: "FIXED",
    departmentId: 1,
    designationId: 1,
    department: mockDepartments[0],
    designation: mockDesignations[0],
    joiningDate: "2023-03-10",
    currentSalary: { id: 2, baseAmount: 13500000, currency: "PKR", effectiveDate: "2023-03-10", reason: "Joining salary" },
    createdAt: "2023-03-10T09:00:00Z",
  },
  {
    id: 3,
    firstName: "Sana",
    lastName: "Malik",
    fullName: "Sana Malik",
    cnic: "35202-1000274-1",
    email: "sana.malik@techmanion.com",
    phone: "+92 300 1002222",
    employeeType: "CONTRACT",
    status: "ON_LEAVE",
    compensationType: "FIXED",
    departmentId: 2,
    designationId: 3,
    department: mockDepartments[1],
    designation: mockDesignations[2],
    joiningDate: "2023-06-01",
    currentSalary: { id: 3, baseAmount: 15000000, currency: "PKR", effectiveDate: "2023-06-01", reason: "Joining salary" },
    createdAt: "2023-06-01T09:00:00Z",
  },
];

export const mockProjects: Project[] = [
  {
    id: 1,
    name: "Learn OS Revamp",
    clientName: "Learn OS",
    status: "IN_PROGRESS",
    startDate: "2025-11-01",
    endDate: "2026-04-30",
    contractValue: 450000000,
    currency: "PKR",
    trelloUrl: "https://trello.com/b/learnos",
    assignments: [
      { id: 1, employeeId: 1, employeeName: "Ayesha Khan", projectRole: "Tech Lead", allocationPct: 100 },
    ],
  },
  {
    id: 2,
    name: "MenuClick POS",
    clientName: "MenuClick",
    status: "IN_PROGRESS",
    startDate: "2025-09-15",
    contractValue: 620000000,
    currency: "PKR",
    trelloUrl: "https://trello.com/b/menuclick",
    assignments: [
      { id: 2, employeeId: 2, employeeName: "Hamza Siddiqui", projectRole: "Backend Engineer", allocationPct: 100 },
    ],
  },
  {
    id: 3,
    name: "Internal HR Portal",
    clientName: "Techmanion",
    status: "PLANNING",
    startDate: "2026-08-01",
    contractValue: 0,
    currency: "PKR",
    assignments: [
      { id: 3, employeeId: 3, employeeName: "Sana Malik", projectRole: "Product Designer", allocationPct: 40 },
    ],
  },
];

function payslipsFor(status: readonly ["PAID" | "PARTIALLY_PAID" | "PENDING", "PAID" | "PARTIALLY_PAID" | "PENDING", "PAID" | "PARTIALLY_PAID" | "PENDING"], idOffset: number) {
  return mockEmployees.map((employee, index) => {
    const gross = employee.currentSalary?.baseAmount ?? 15000000;
    const tax = Math.round(gross * 0.08);
    const net = gross - tax;
    const paymentStatus = status[index];
    const paidAmount = paymentStatus === "PAID" ? net : paymentStatus === "PARTIALLY_PAID" ? Math.round(net * 0.5) : 0;
    return {
      id: idOffset + index,
      employeeId: employee.id,
      employeeName: employee.fullName,
      baseAmount: gross,
      currency: "PKR",
      grossAmount: gross,
      taxAmount: tax,
      netAmount: net,
      paymentStatus,
      paidAmount,
    };
  });
}

const currentMonth = new Date().toISOString().slice(0, 7);
const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

export const mockPayrollRuns: PayrollRun[] = [
  {
    id: 1,
    periodMonth: currentMonth,
    status: "DRAFT",
    payslips: payslipsFor(["PENDING", "PARTIALLY_PAID", "PENDING"], 1),
  },
  {
    id: 2,
    periodMonth: previousMonth,
    status: "COMPLETED",
    payslips: payslipsFor(["PAID", "PAID", "PAID"], 4),
  },
];

export const mockTaxSlabs: TaxSlab[] = [
  { id: 1, fiscalYear: "2025-26", lowerBound: 0, upperBound: 60000000, fixedAmount: 0, rateBpsOverLower: 0 },
  { id: 2, fiscalYear: "2025-26", lowerBound: 60000000, upperBound: 120000000, fixedAmount: 0, rateBpsOverLower: 500 },
  { id: 3, fiscalYear: "2025-26", lowerBound: 120000000, fixedAmount: 3000000, rateBpsOverLower: 1500 },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, action: "UPDATE", entityType: "Employee", entityId: "1", actorUserId: 1, createdAt: "2026-07-20T10:15:00Z" },
  { id: 2, action: "CREATE", entityType: "Project", entityId: "3", actorUserId: 1, createdAt: "2026-07-18T14:02:00Z" },
  { id: 3, action: "PAYMENT", entityType: "Payslip", entityId: "2", actorUserId: 1, createdAt: "2026-07-15T09:40:00Z" },
];
