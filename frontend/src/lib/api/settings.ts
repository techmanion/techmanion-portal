import type { NamedOption } from "../../types";
import { api } from "./client";

export function listDepartments() {
  return api<NamedOption[]>("/admin/settings/departments");
}

export function listDesignations() {
  return api<NamedOption[]>("/admin/settings/designations");
}

export function addDepartment(name: string) {
  return api<NamedOption>(`/admin/settings/departments?name=${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export function addDesignation(name: string) {
  return api<NamedOption>(`/admin/settings/designations?name=${encodeURIComponent(name)}`, {
    method: "POST",
  });
}
