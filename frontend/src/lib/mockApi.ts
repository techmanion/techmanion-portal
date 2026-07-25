/**
 * In-memory mock backend. Intercepts every call lib/api.ts would otherwise
 * send over the network, seeded from the dummy records in mockData.ts.
 * Only reachable when BACKEND_DISABLED is true — see mockData.ts.
 */
import type {
  Employee,
  EmployeeDocument,
  EmployeePayload,
  NamedOption,
  PayrollRun,
  Payslip,
  Project,
  TaxSlab,
} from "../types";
import {
  mockAuditLogs,
  mockCredentials,
  mockDepartments,
  mockDesignations,
  mockEmployees,
  mockPayrollRuns,
  mockProjects,
  mockTaxSlabs,
  mockUser,
} from "./mockData";

export class MockApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextId(rows: { id: number }[]) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

let employees: Employee[] = clone(mockEmployees);
let departments: NamedOption[] = clone(mockDepartments);
let designations: NamedOption[] = clone(mockDesignations);
let projects: Project[] = clone(mockProjects);
let payrollRuns: PayrollRun[] = clone(mockPayrollRuns);
let taxSlabs: TaxSlab[] = clone(mockTaxSlabs);
const auditLogs = clone(mockAuditLogs);
const documentsByEmployee: Record<number, EmployeeDocument[]> = {};
const documentBlobs: Record<number, Blob> = {};

export async function mockLogin(email: string, password: string) {
  await delay();
  if (email.trim().toLowerCase() !== mockCredentials.email || password !== mockCredentials.password) {
    throw new MockApiError("Email or password is incorrect.", 401);
  }
  return { accessToken: "mock-token", user: clone(mockUser) };
}

export async function mockDownload(path: string): Promise<Blob> {
  await delay();
  const match = path.match(/^\/documents\/(\d+)\/download$/);
  const blob = match ? documentBlobs[Number(match[1])] : undefined;
  if (!blob) throw new MockApiError("Document not found.", 404);
  return blob;
}

export async function mockRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  await delay();
  const method = (init.method ?? "GET").toUpperCase();
  const [pathname, queryString] = path.split("?");
  const query = new URLSearchParams(queryString ?? "");
  const segments = pathname.split("/").filter(Boolean);
  const body = typeof init.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;

  if (pathname === "/auth/me" && method === "GET") return clone(mockUser);

  if (segments[0] === "employees") {
    if (segments.length === 1 && method === "GET") {
      let rows = employees;
      const search = query.get("search")?.toLowerCase();
      const status = query.get("status_filter");
      const departmentId = query.get("department_id");
      const designationId = query.get("designation_id");
      if (search) rows = rows.filter((row) => `${row.fullName} ${row.email}`.toLowerCase().includes(search));
      if (status) rows = rows.filter((row) => row.status === status);
      if (departmentId) rows = rows.filter((row) => String(row.departmentId) === departmentId);
      if (designationId) rows = rows.filter((row) => String(row.designationId) === designationId);
      return clone(rows);
    }
    if (segments.length === 1 && method === "POST") {
      const payload = body as unknown as EmployeePayload;
      const id = nextId(employees);
      const employee: Employee = {
        id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: `${payload.firstName} ${payload.lastName}`,
        cnic: payload.cnic,
        dateOfBirth: payload.dateOfBirth,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        emergencyContactName: payload.emergencyContactName,
        emergencyContactPhone: payload.emergencyContactPhone,
        employeeType: payload.employeeType,
        status: payload.status,
        compensationType: "FIXED",
        departmentId: payload.departmentId,
        designationId: payload.designationId,
        department: departments.find((row) => row.id === payload.departmentId),
        designation: designations.find((row) => row.id === payload.designationId),
        joiningDate: payload.joiningDate,
        probationEndDate: payload.probationEndDate,
        confirmationDate: payload.confirmationDate,
        accessLog: payload.accessLog,
        currentSalary: payload.baseAmount
          ? { id, baseAmount: payload.baseAmount, currency: payload.currency ?? "PKR", effectiveDate: payload.joiningDate, reason: "Joining salary" }
          : undefined,
        createdAt: new Date().toISOString(),
      };
      employees = [employee, ...employees];
      return clone(employee);
    }
    if (segments.length === 2 && method === "GET") {
      const employee = employees.find((row) => row.id === Number(segments[1]));
      if (!employee) throw new MockApiError("Employee not found.", 404);
      return clone(employee);
    }
    if (segments.length === 2 && method === "PUT") {
      const id = Number(segments[1]);
      const index = employees.findIndex((row) => row.id === id);
      if (index === -1) throw new MockApiError("Employee not found.", 404);
      const payload = body as unknown as EmployeePayload;
      employees[index] = {
        ...employees[index],
        ...payload,
        fullName: `${payload.firstName} ${payload.lastName}`,
        department: departments.find((row) => row.id === payload.departmentId),
        designation: designations.find((row) => row.id === payload.designationId),
      };
      return clone(employees[index]);
    }
    if (segments.length === 3 && segments[2] === "salary" && method === "POST") {
      const id = Number(segments[1]);
      const index = employees.findIndex((row) => row.id === id);
      if (index === -1) throw new MockApiError("Employee not found.", 404);
      const payload = body as unknown as { baseAmount: number; currency: string; effectiveDate: string; reason: string };
      employees[index] = {
        ...employees[index],
        currentSalary: { id: nextId([{ id: 0 }]) + id, ...payload },
      };
      return clone(employees[index]);
    }
    if (segments.length === 3 && segments[2] === "documents" && method === "GET") {
      return clone(documentsByEmployee[Number(segments[1])] ?? []);
    }
    if (segments.length === 3 && segments[2] === "documents" && method === "POST") {
      const id = Number(segments[1]);
      const formData = init.body as FormData;
      const file = formData.get("file") as File | null;
      const kind = String(formData.get("kind") ?? "OTHER");
      const existing = documentsByEmployee[id] ?? [];
      const docId = nextId(existing.length ? existing : [{ id: 0 }]);
      const document: EmployeeDocument = {
        id: docId,
        kind,
        fileName: file?.name ?? "document",
        mimeType: file?.type ?? "application/octet-stream",
        sizeBytes: file?.size ?? 0,
        createdAt: new Date().toISOString(),
      };
      documentsByEmployee[id] = [...existing, document];
      if (file) documentBlobs[docId] = file;
      return clone(document);
    }
  }

  if (segments[0] === "settings" && segments[1] === "departments") {
    if (method === "GET") return clone(departments);
    if (method === "POST") {
      const item = { id: nextId(departments), name: query.get("name") ?? "New department", isActive: true };
      departments = [...departments, item];
      return clone(item);
    }
  }
  if (segments[0] === "settings" && segments[1] === "designations") {
    if (method === "GET") return clone(designations);
    if (method === "POST") {
      const item = { id: nextId(designations), name: query.get("name") ?? "New designation", isActive: true };
      designations = [...designations, item];
      return clone(item);
    }
  }
  if (segments[0] === "settings" && segments[1] === "tax-slabs") {
    if (method === "GET") return clone(taxSlabs);
    if (method === "POST") {
      const item = { id: nextId(taxSlabs), ...(body as unknown as Omit<TaxSlab, "id">) };
      taxSlabs = [...taxSlabs, item];
      return clone(item);
    }
  }

  if (pathname === "/audit" && method === "GET") return clone(auditLogs);

  if (segments[0] === "projects") {
    if (segments.length === 1 && method === "GET") return clone(projects);
    if (segments.length === 1 && method === "POST") {
      const payload = body as unknown as Omit<Project, "id" | "assignments">;
      const project: Project = { id: nextId(projects), assignments: [], ...payload };
      projects = [project, ...projects];
      return clone(project);
    }
    if (segments.length === 3 && segments[2] === "assignments" && method === "POST") {
      const id = Number(segments[1]);
      const index = projects.findIndex((row) => row.id === id);
      if (index === -1) throw new MockApiError("Project not found.", 404);
      const payload = body as unknown as { employeeId: number; projectRole: string; allocationPct: number };
      const employee = employees.find((row) => row.id === payload.employeeId);
      const assignment = {
        id: nextId(projects.flatMap((row) => row.assignments)),
        employeeId: payload.employeeId,
        employeeName: employee?.fullName ?? "Unknown",
        projectRole: payload.projectRole,
        allocationPct: payload.allocationPct,
      };
      projects[index] = { ...projects[index], assignments: [...projects[index].assignments, assignment] };
      return clone(assignment);
    }
  }

  if (segments[0] === "payroll") {
    if (segments.length === 1 && method === "GET") return clone(payrollRuns);
    if (segments.length === 2 && method === "POST") {
      const periodMonth = segments[1];
      const allPayslips = payrollRuns.flatMap((run) => run.payslips);
      let payslipId = nextId(allPayslips.length ? allPayslips : [{ id: 0 }]);
      const payslips: Payslip[] = employees
        .filter((employee) => employee.status === "ACTIVE")
        .map((employee) => {
          const gross = employee.currentSalary?.baseAmount ?? 15000000;
          const tax = Math.round(gross * 0.08);
          return {
            id: payslipId++,
            employeeId: employee.id,
            employeeName: employee.fullName,
            baseAmount: gross,
            currency: employee.currentSalary?.currency ?? "PKR",
            grossAmount: gross,
            taxAmount: tax,
            netAmount: gross - tax,
            paymentStatus: "PENDING",
            paidAmount: 0,
          };
        });
      const run: PayrollRun = { id: nextId(payrollRuns), periodMonth, status: "DRAFT", payslips };
      payrollRuns = [run, ...payrollRuns];
      return clone(run);
    }
  }

  if (segments[0] === "payslips" && segments[2] === "payment" && method === "PATCH") {
    const id = Number(segments[1]);
    const payload = body as unknown as { paymentStatus: Payslip["paymentStatus"]; paidAmount: number };
    for (const run of payrollRuns) {
      const slip = run.payslips.find((row) => row.id === id);
      if (slip) {
        slip.paymentStatus = payload.paymentStatus;
        slip.paidAmount = payload.paidAmount;
        return clone(slip);
      }
    }
    throw new MockApiError("Payslip not found.", 404);
  }

  throw new MockApiError(`Mock API: no handler for ${method} ${pathname}`, 404);
}
