import type { PayrollEntry } from "../../types";
import { api } from "./client";

export interface PayrollEntryPayload {
  employeeId: number;
  month: string;
  baseCompensation: number;
  adjustment: number;
  currency: string;
  notes: string | null;
}

export function listPayrollEntries(month: string) {
  return api<PayrollEntry[]>(`/payroll?month=${month}`);
}

export function generatePayroll(month: string) {
  return api<PayrollEntry[]>(`/payroll/generate?month=${month}`, { method: "POST" });
}

export function createPayrollEntry(payload: PayrollEntryPayload) {
  return api<PayrollEntry>("/payroll", { method: "POST", body: JSON.stringify(payload) });
}

export function updatePayrollEntry(
  entryId: number,
  payload: Omit<PayrollEntryPayload, "employeeId" | "month">,
) {
  return api<PayrollEntry>(`/payroll/${entryId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deletePayrollEntry(entryId: number) {
  return api<void>(`/payroll/${entryId}`, { method: "DELETE" });
}

export function markPayrollPaid(entryId: number) {
  return api<PayrollEntry>(`/payroll/${entryId}/pay`, { method: "PATCH", body: JSON.stringify({}) });
}
