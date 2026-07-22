/**
 * Auth.js (NextAuth v5) configuration — credentials login for Admin/HR only (v1).
 *
 * Session strategy is JWT (required for the Credentials provider). The user's
 * id and role are carried in the token and exposed on `session.user` so
 * server-side guards (lib/auth/guards) can enforce RBAC without a DB round-trip.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/auth/password";
import { Role } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/** Roles permitted to log in during v1 (decisions.md D2). */
const LOGIN_ROLES: Role[] = [Role.ADMIN, Role.HR];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });

        // Reject unknown, deactivated, or non-login-role users. Do not leak
        // which condition failed.
        if (!user || !user.isActive || !LOGIN_ROLES.includes(user.role)) {
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
