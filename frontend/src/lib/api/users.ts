import type { User, UserRole } from "../../types";
import { api } from "./client";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export function listUsers() {
  return api<User[]>("/users");
}

export function createUser(payload: CreateUserPayload) {
  return api<User>("/users", { method: "POST", body: JSON.stringify(payload) });
}

export function updateUser(userId: number, payload: { role?: UserRole; isActive?: boolean }) {
  return api<User>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(payload) });
}
