import type { User, UserRole } from "../../types";
import { api } from "./client";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export function listUsers() {
  return api<User[]>("/admin/users");
}

export function createUser(payload: CreateUserPayload) {
  return api<User>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

export function updateUser(userId: number, payload: { role?: UserRole; isActive?: boolean }) {
  return api<User>(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteUser(userId: number) {
  return api<void>(`/admin/users/${userId}`, { method: "DELETE" });
}
