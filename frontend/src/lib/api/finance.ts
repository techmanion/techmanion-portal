import type {
  Expense,
  ExpensePayload,
  FinanceIncome,
  FinanceOverview,
  PayrollEntry,
} from "../../types";
import { api } from "./client";

export interface PayrollEntryPayload {
  employeeId: number;
  month: string;
  baseCompensation: number;
  adjustment: number;
  currency: string;
  notes: string | null;
}

export function getFinanceOverview() {
  return api<FinanceOverview>("/finance/overview");
}

export function listFinanceIncome() {
  return api<FinanceIncome[]>("/finance/income");
}

export function listExpenses() {
  return api<Expense[]>("/finance/expenses");
}

export async function getExpense(expenseId: number): Promise<Expense | undefined> {
  const expenses = await listExpenses();
  return expenses.find((expense) => expense.id === expenseId);
}

export function createExpense(payload: ExpensePayload) {
  return api<Expense>("/finance/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpense(expenseId: number, payload: ExpensePayload) {
  return api<Expense>(`/finance/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(expenseId: number) {
  return api<void>(`/finance/expenses/${expenseId}`, { method: "DELETE" });
}

export function listPayrollEntries(month: string) {
  return api<PayrollEntry[]>(`/finance/payroll?month=${encodeURIComponent(month)}`);
}

export async function getPayrollEntry(
  month: string,
  entryId: number,
): Promise<PayrollEntry | undefined> {
  const entries = await listPayrollEntries(month);
  return entries.find((entry) => entry.id === entryId);
}

export function generatePayroll(month: string) {
  return api<PayrollEntry[]>(`/finance/payroll/generate?month=${encodeURIComponent(month)}`, {
    method: "POST",
  });
}

export function createPayrollEntry(payload: PayrollEntryPayload) {
  return api<PayrollEntry>("/finance/payroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePayrollEntry(
  entryId: number,
  payload: Omit<PayrollEntryPayload, "employeeId" | "month">,
) {
  return api<PayrollEntry>(`/finance/payroll/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePayrollEntry(entryId: number) {
  return api<void>(`/finance/payroll/${entryId}`, { method: "DELETE" });
}

export function markPayrollPaid(entryId: number) {
  return api<PayrollEntry>(`/finance/payroll/${entryId}/pay`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
