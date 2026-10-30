import { describe, expect, it } from "vitest";
import type { PayrollEntry } from "../types";
import { buildSalarySlip, formatSlipAmount, formatSlipMonth, slipEmploymentType } from "./salarySlip";

const entry = (overrides: Partial<PayrollEntry> = {}): PayrollEntry => ({
  id: 1,
  employeeId: 1,
  employeeName: "Test Person",
  employeeCode: "TM-EMP-00001",
  designationName: "Engineer",
  employeeType: "EMPLOYEE",
  month: "2026-08",
  baseCompensation: 19500000,
  bonus: 0,
  holidayCompensation: 1950000,
  commissionAmount: 0,
  adjustment: 0,
  finalAmount: 21450000,
  currency: "PKR",
  status: "PAID",
  bankAccountId: null,
  bankTransactionId: null,
  pkrEquivalent: null,
  ...overrides,
});

describe("buildSalarySlip", () => {
  it("always lists basic salary, bonus, and holiday compensation", () => {
    const slip = buildSalarySlip(entry());
    expect(slip.earnings.map((row) => row.label)).toEqual(["Basic Salary", "Bonus", "Holiday Work Compensation"]);
    expect(slip.totalEarnings).toBe(21450000);
    expect(slip.totalDeductions).toBe(0);
    expect(slip.netSalary).toBe(21450000);
  });

  it("adds commission and a positive adjustment to earnings", () => {
    const slip = buildSalarySlip(entry({ commissionAmount: 100000, adjustment: 50000, finalAmount: 21600000 }));
    expect(slip.earnings.map((row) => row.label)).toContain("Commission");
    expect(slip.earnings.map((row) => row.label)).toContain("Adjustment");
    expect(slip.totalEarnings).toBe(21600000);
  });

  it("treats a negative adjustment as a deduction so earnings minus deductions equals net", () => {
    const slip = buildSalarySlip(entry({ adjustment: -450000, finalAmount: 21000000 }));
    expect(slip.earnings.map((row) => row.label)).not.toContain("Adjustment");
    expect(slip.totalDeductions).toBe(450000);
    expect(slip.totalEarnings - slip.totalDeductions).toBe(slip.netSalary);
  });
});

describe("slip formatting", () => {
  it("uses lakh grouping for PKR and thousands for other currencies", () => {
    expect(formatSlipAmount(21450000, "PKR")).toBe("2,14,500.00");
    expect(formatSlipAmount(21450000, "USD")).toBe("214,500.00");
  });

  it("formats the month like the slip heading", () => {
    expect(formatSlipMonth("2026-08")).toBe("AUG 2026");
  });

  it("shows regular employees as permanent", () => {
    expect(slipEmploymentType("EMPLOYEE")).toBe("Permanent");
    expect(slipEmploymentType("CONTRACTOR")).toBe("Contractor");
    expect(slipEmploymentType(null)).toBe("—");
  });
});
