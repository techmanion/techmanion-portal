import type { PayrollEntry } from "../types";
import { employeeTypeLabel } from "./format";

export interface SalarySlipRow {
  label: string;
  amount: number;
}

export interface SalarySlip {
  earnings: SalarySlipRow[];
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

/** Commission and positive adjustments only appear on slips that have them. */
export function buildSalarySlip(entry: PayrollEntry): SalarySlip {
  const earnings: SalarySlipRow[] = [
    { label: "Basic Salary", amount: entry.baseCompensation },
    { label: "Bonus", amount: entry.bonus },
    { label: "Holiday Work Compensation", amount: entry.holidayCompensation },
  ];
  if (entry.commissionAmount) earnings.push({ label: "Commission", amount: entry.commissionAmount });
  if (entry.adjustment > 0) earnings.push({ label: "Adjustment", amount: entry.adjustment });
  return {
    earnings,
    totalEarnings: earnings.reduce((sum, row) => sum + row.amount, 0),
    totalDeductions: entry.adjustment < 0 ? -entry.adjustment : 0,
    netSalary: entry.finalAmount,
  };
}

/** PKR slips use lakh grouping (1,95,000.00); other currencies use thousands. */
export function formatSlipAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(currency === "PKR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatSlipMonth(month: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(`${month}-01T00:00:00`))
    .toUpperCase();
}

export function slipEmploymentType(employeeType: PayrollEntry["employeeType"]): string {
  if (!employeeType) return "—";
  return employeeType === "EMPLOYEE" ? "Permanent" : employeeTypeLabel(employeeType);
}
