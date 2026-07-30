import type { User } from "../../types";
import { API_URL, api, ApiError, readErrorDetail } from "./client";

export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json()) as { detail?: unknown };
    throw new ApiError(readErrorDetail(body.detail) ?? "Email or password is incorrect.", response.status);
  }
  return response.json() as Promise<{ accessToken: string; user: User }>;
}

export function updateProfile(name: string) {
  return api<User>("/auth/me", { method: "PATCH", body: JSON.stringify({ name }) });
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return api<void>("/auth/change-password", { method: "POST", body: JSON.stringify(payload) });
}
