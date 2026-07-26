import { MockApiError, mockRequest } from "./mockApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "techmanion_access_token";

/**
 * Payroll is not wired to the real backend yet — those requests are served
 * from the in-memory fixture in mockApi.ts. Every other resource hits the
 * live API.
 */
const MOCKED_PATH = /^\/(payroll|payslips)(\/|\?|$)/;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function toApiError(reason: unknown): ApiError {
  if (reason instanceof MockApiError) return new ApiError(reason.message, reason.status);
  if (reason instanceof ApiError) return reason;
  return new ApiError(reason instanceof Error ? reason.message : "Something went wrong. Try again.", 500);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (MOCKED_PATH.test(path)) {
    try {
      return (await mockRequest(path, init)) as T;
    } catch (reason) {
      throw toApiError(reason);
    }
  }

  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = "Something went wrong. Try again.";
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      // Keep the safe fallback when the response is not JSON.
    }
    if (response.status === 401) setToken(null);
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new ApiError("File could not be downloaded.", response.status);
  return response.blob();
}

export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json()) as { detail?: string };
    throw new ApiError(body.detail ?? "Email or password is incorrect.", response.status);
  }
  return response.json() as Promise<{ accessToken: string; user: import("../types").User }>;
}
