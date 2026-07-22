/**
 * Server-side RBAC guards. Call these at the top of every Server Action, Route
 * Handler, or protected page/layout — never trust the client (architecture.md §3).
 *
 * - Not authenticated  -> redirect to /login
 * - Authenticated but wrong role -> redirect to / (the app home)
 */
import "server-only";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/** Returns the current user or null. Does not redirect. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require one of the given roles. Redirects to /login if unauthenticated, or to
 * "/" if authenticated but lacking the role.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** Convenience: Admin-only actions (e.g. user management, tax slabs). */
export function requireAdmin(): Promise<SessionUser> {
  return requireRole(Role.ADMIN);
}
