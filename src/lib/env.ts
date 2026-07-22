/**
 * Validated environment variables. Import `env` from here instead of reading
 * `process.env` directly so a missing/blank var fails fast at boot with a clear
 * message rather than surfacing as a mysterious runtime error later.
 *
 * Server-only — never import this into a Client Component.
 */
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required (openssl rand -base64 32)"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n" +
      JSON.stringify(parsed.error.issues, null, 2),
  );
  throw new Error("Invalid environment variables — see log above.");
}

export const env = parsed.data;
