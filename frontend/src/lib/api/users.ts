import type { User } from "../../types";
import { api } from "./client";

export interface CreateUserPayload {
  email: string;
  password: string;
  employeeId: number;
}

export function listUsers() {
  return api<User[]>("/admin/users");
}

export function createUser(payload: CreateUserPayload) {
  return api<User>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
}
