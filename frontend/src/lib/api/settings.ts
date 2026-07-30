import type { NamedOption } from "../../types";
import { api } from "./client";

export function listDepartments() {
  return api<NamedOption[]>("/settings/departments");
}

export function listDesignations() {
  return api<NamedOption[]>("/settings/designations");
}

export function addDepartment(name: string) {
  return api<NamedOption>(`/settings/departments?name=${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export function addDesignation(name: string) {
  return api<NamedOption>(`/settings/designations?name=${encodeURIComponent(name)}`, {
    method: "POST",
  });
}
