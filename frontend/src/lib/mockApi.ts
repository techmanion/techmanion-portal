/**
 * In-memory payroll fixture. Payroll isn't wired to the real backend yet, so
 * lib/api.ts routes every `/payroll` and `/payslips` call here instead of over
 * the network. Every other resource (auth, employees, projects, settings,
 * documents, audit) talks to the live API — see lib/api.ts.
 *
 * The fake employees below exist only to populate payslips and are
 * intentionally not connected to the real `employees` table (note the high
 * ids), so nothing here can be mistaken for real HR data.
 */
import type { NamedOption, PayrollRun, Payslip } from "../types";

export class MockApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MockPayrollEmployee {
  id: number;
  fullName: string;
  baseAmount: number;
  currency: string;
  departmentId: number;
}

const mockPayrollEmployees: MockPayrollEmployee[] = [
  { id: 501, fullName: "Ayesha Khan", baseAmount: 15000000, currency: "PKR", departmentId: 1 },
  { id: 502, fullName: "Hamza Siddiqui", baseAmount: 13500000, currency: "PKR", departmentId: 1 },
  { id: 503, fullName: "Sana Malik", baseAmount: 15000000, currency: "PKR", departmentId: 2 },
];

export const mockPayrollDepartments: NamedOption[] = [
  { id: 1, name: "Engineering", isActive: true },
  { id: 2, name: "Design", isActive: true },
];

export const mockPayrollEmployeeDepartments: Record<number, number> = Object.fromEntries(
  mockPayrollEmployees.map((employee) => [employee.id, employee.departmentId]),
);

function payslipsFor(
  statuses: readonly ["PAID" | "PARTIALLY_PAID" | "PENDING", "PAID" | "PARTIALLY_PAID" | "PENDING", "PAID" | "PARTIALLY_PAID" | "PENDING"],
  idOffset: number,
): Payslip[] {
  return mockPayrollEmployees.map((employee, index) => {
    const gross = employee.baseAmount;
    const tax = Math.round(gross * 0.08);
    const net = gross - tax;
    const paymentStatus = statuses[index];
    const paidAmount = paymentStatus === "PAID" ? net : paymentStatus === "PARTIALLY_PAID" ? Math.round(net * 0.5) : 0;
    return {
      id: idOffset + index,
      employeeId: employee.id,
      employeeName: employee.fullName,
      baseAmount: gross,
      currency: employee.currency,
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

let payrollRuns: PayrollRun[] = [
  { id: 1, periodMonth: currentMonth, status: "DRAFT", payslips: payslipsFor(["PENDING", "PARTIALLY_PAID", "PENDING"], 1) },
  { id: 2, periodMonth: previousMonth, status: "COMPLETED", payslips: payslipsFor(["PAID", "PAID", "PAID"], 4) },
];

function nextId(rows: { id: number }[]) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function mockRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  await delay();
  const method = (init.method ?? "GET").toUpperCase();
  const [pathname] = path.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const body = typeof init.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;

  if (segments[0] === "payroll") {
    if (segments.length === 1 && method === "GET") return clone(payrollRuns);
    if (segments.length === 2 && method === "POST") {
      const periodMonth = segments[1];
      if (payrollRuns.some((run) => run.periodMonth === periodMonth)) {
        throw new MockApiError("Payroll already exists for this month.", 409);
      }
      const allPayslips = payrollRuns.flatMap((run) => run.payslips);
      let payslipId = nextId(allPayslips.length ? allPayslips : [{ id: 0 }]);
      const payslips: Payslip[] = mockPayrollEmployees.map((employee) => {
        const gross = employee.baseAmount;
        const tax = Math.round(gross * 0.08);
        return {
          id: payslipId++,
          employeeId: employee.id,
          employeeName: employee.fullName,
          baseAmount: gross,
          currency: employee.currency,
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
