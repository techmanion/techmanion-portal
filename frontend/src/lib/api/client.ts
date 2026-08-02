export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "techmanion_access_token";

/** Dispatched on window when a request 401s while we believed we had a valid session. */
export const UNAUTHORIZED_EVENT = "techmanion:unauthorized";

export function avatarSrc(path?: string | null): string | undefined {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

let unauthorizedNotified = false;

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    unauthorizedNotified = false;
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function handleUnauthorized(): void {
  const hadToken = Boolean(getToken());
  setToken(null);
  if (hadToken && !unauthorizedNotified) {
    unauthorizedNotified = true;
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

export function readErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((issue: ValidationIssue) => {
        const field = issue.loc?.[issue.loc.length - 1];
        return field && typeof field === "string" ? `${field}: ${issue.msg}` : issue.msg;
      })
      .filter(Boolean);
    return messages.length ? messages.join(" ") : null;
  }
  return null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = "Something went wrong. Try again.";
    try {
      const body = (await response.json()) as { detail?: unknown };
      message = readErrorDetail(body.detail) ?? message;
    } catch {
      // Keep the safe fallback when the response is not JSON.
    }
    if (response.status === 401) handleUnauthorized();
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
  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new ApiError("File could not be downloaded.", response.status);
  }
  return response.blob();
}
