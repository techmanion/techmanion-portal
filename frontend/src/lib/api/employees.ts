import type { Employee, EmployeeDocument, EmployeePayload } from "../../types";
import { api, apiBlob } from "./client";

export function listEmployees(query: string) {
  return api<Employee[]>(`/admin/employees?${query}`);
}

export function getEmployee(employeeId: string | number) {
  return api<Employee>(`/admin/employees/${employeeId}`);
}

export function createEmployee(payload: EmployeePayload) {
  return api<Employee>("/admin/employees", { method: "POST", body: JSON.stringify(payload) });
}

export function updateEmployee(employeeId: string | number, payload: Partial<EmployeePayload>) {
  return api<Employee>(`/admin/employees/${employeeId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function uploadEmployeeAvatar(employeeId: string | number, file: File) {
  const form = new FormData();
  form.append("file", file);
  return api<Employee>(`/admin/employees/${employeeId}/avatar`, { method: "POST", body: form });
}

export function reviseSalary(
  employeeId: string | number,
  payload: { baseAmount: number; currency: string; effectiveDate: string; reason: string },
) {
  return api(`/admin/employees/${employeeId}/salary`, { method: "POST", body: JSON.stringify(payload) });
}

export function listEmployeeDocuments(employeeId: string | number) {
  return api<EmployeeDocument[]>(`/admin/employees/${employeeId}/documents`);
}

export function uploadEmployeeDocument(employeeId: string | number, form: FormData) {
  return api(`/admin/employees/${employeeId}/documents`, { method: "POST", body: form });
}

export function downloadDocument(documentId: number) {
  return apiBlob(`/admin/documents/${documentId}/download`);
}
