import type { Employee, EmployeeDocument, EmployeePayload } from "../../types";
import { api, apiBlob } from "./client";

export function listEmployees(query: string) {
  return api<Employee[]>(`/employees?${query}`);
}

export function getEmployee(employeeId: string | number) {
  return api<Employee>(`/employees/${employeeId}`);
}

export function createEmployee(payload: EmployeePayload) {
  return api<Employee>("/employees", { method: "POST", body: JSON.stringify(payload) });
}

export function updateEmployee(employeeId: string | number, payload: Partial<EmployeePayload>) {
  return api<Employee>(`/employees/${employeeId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function reviseSalary(
  employeeId: string | number,
  payload: { baseAmount: number; currency: string; effectiveDate: string; reason: string },
) {
  return api(`/employees/${employeeId}/salary`, { method: "POST", body: JSON.stringify(payload) });
}

export function listEmployeeDocuments(employeeId: string | number) {
  return api<EmployeeDocument[]>(`/employees/${employeeId}/documents`);
}

export function uploadEmployeeDocument(employeeId: string | number, form: FormData) {
  return api(`/employees/${employeeId}/documents`, { method: "POST", body: form });
}

export function downloadDocument(documentId: number) {
  return apiBlob(`/documents/${documentId}/download`);
}
