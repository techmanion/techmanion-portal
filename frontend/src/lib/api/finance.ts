import type {
  BankAccount,
  BankAccountPayload,
  BankTransactionPayload,
  BankTransferPayload,
  BankTransferResult,
  Expense,
  ExpensePayload,
  FinanceIncome,
  FinanceOverview,
  PayrollEntry,
  PayrollMarkPaidPayload,
} from "../../types";
import { api } from "./client";

export interface PayrollEntryPayload {
  employeeId: number;
  month: string;
  baseCompensation: number;
  adjustment: number;
  currency: string;
  notes: string | null;
  pkrEquivalent?: number | null;
}

export function getFinanceOverview() {
  return api<FinanceOverview>("/admin/finance/overview");
}

export function listFinanceIncome() {
  return api<FinanceIncome[]>("/admin/finance/income");
}

export function listExpenses() {
  return api<Expense[]>("/admin/finance/expenses");
}

export async function getExpense(expenseId: number): Promise<Expense | undefined> {
  const expenses = await listExpenses();
  return expenses.find((expense) => expense.id === expenseId);
}

export function createExpense(payload: ExpensePayload) {
  return api<Expense>("/admin/finance/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpense(expenseId: number, payload: ExpensePayload) {
  return api<Expense>(`/admin/finance/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(expenseId: number) {
  return api<void>(`/admin/finance/expenses/${expenseId}`, { method: "DELETE" });
}

export function listPayrollEntries(month: string) {
  return api<PayrollEntry[]>(`/admin/finance/payroll?month=${encodeURIComponent(month)}`);
}

export async function getPayrollEntry(
  month: string,
  entryId: number,
): Promise<PayrollEntry | undefined> {
  const entries = await listPayrollEntries(month);
  return entries.find((entry) => entry.id === entryId);
}

export function generatePayroll(month: string) {
  return api<PayrollEntry[]>(`/admin/finance/payroll/generate?month=${encodeURIComponent(month)}`, {
    method: "POST",
  });
}

export function createPayrollEntry(payload: PayrollEntryPayload) {
  return api<PayrollEntry>("/admin/finance/payroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePayrollEntry(
  entryId: number,
  payload: Omit<PayrollEntryPayload, "employeeId" | "month">,
) {
  return api<PayrollEntry>(`/admin/finance/payroll/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePayrollEntry(entryId: number) {
  return api<void>(`/admin/finance/payroll/${entryId}`, { method: "DELETE" });
}

export function markPayrollPaid(entryId: number, payload: PayrollMarkPaidPayload) {
  return api<PayrollEntry>(`/admin/finance/payroll/${entryId}/pay`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listBankAccounts() {
  return api<BankAccount[]>("/admin/finance/bank-accounts");
}

export function getBankAccount(accountId: number) {
  return api<BankAccount>(`/admin/finance/bank-accounts/${accountId}`);
}

export function createBankAccount(payload: BankAccountPayload) {
  return api<BankAccount>("/admin/finance/bank-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBankAccount(accountId: number, payload: BankAccountPayload) {
  return api<BankAccount>(`/admin/finance/bank-accounts/${accountId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function addBankCredit(accountId: number, payload: BankTransactionPayload) {
  return api<BankAccount>(`/admin/finance/bank-accounts/${accountId}/credit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addBankDebit(accountId: number, payload: BankTransactionPayload) {
  return api<BankAccount>(`/admin/finance/bank-accounts/${accountId}/debit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createBankTransfer(payload: BankTransferPayload) {
  return api<BankTransferResult>("/admin/finance/bank-transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
