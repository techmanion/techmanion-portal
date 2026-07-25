import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Logo } from "../components/atoms";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@techmanion.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/employees");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full bg-background text-on-background">
      <section className="hidden w-1/2 flex-col justify-between p-8 lg:flex">
        <Logo />
        <div className="max-w-lg">
          <p className="text-2xl font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
            Unified workspace management for high-performance teams.
          </p>
        </div>
        <div className="flex gap-5 text-sm text-on-surface-variant">
          <span>© 2026 WorkCore Inc.</span>
          <a className="hover:text-primary" href="#">Privacy</a>
          <a className="hover:text-primary" href="#">Terms</a>
        </div>
      </section>

      <section className="flex min-h-screen w-full items-center justify-center p-5 lg:w-1/2">
        <div className="surface-panel relative flex min-h-[calc(100vh-96px)] w-full max-w-[640px] flex-col justify-between overflow-hidden p-8 lg:max-h-[980px]">
          <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-primary/5 blur-[120px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-container">
                <Icon className="text-[18px] text-on-primary-container">layers</Icon>
              </div>
              <span className="text-sm font-medium text-on-surface">Management Portal</span>
            </div>

            <div className="mt-10 max-w-xl">
              <h1 className="text-title font-semibold leading-[1.3] tracking-tight text-on-surface">
                Manage your team and operations in one place
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-on-surface-variant">
                Employees, payroll, projects and company operations — organized in one workspace.
              </p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-[440px]">
              <div className="mb-6">
                <h2 className="mb-1.5 text-xl font-semibold text-on-surface">Welcome back</h2>
                <p className="text-sm text-on-surface-variant">Sign in with your company account</p>
              </div>
              <form className="flex flex-col gap-5" onSubmit={submit}>
                <label className="flex flex-col gap-1.5">
                  <span className="px-1 text-xs font-medium text-on-surface-variant">Work email</span>
                  <input
                    className="h-11 w-full rounded-[var(--radius-control)] border border-outline-variant bg-transparent px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/30 focus:border-primary"
                    placeholder="name@company.com"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="px-1 text-xs font-medium text-on-surface-variant">Password</span>
                  <div className="relative">
                    <input
                      className="h-11 w-full rounded-[var(--radius-control)] border border-outline-variant bg-transparent px-4 pr-11 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/30 focus:border-primary"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      <Icon className="text-[18px]">{showPassword ? "visibility_off" : "visibility"}</Icon>
                    </button>
                  </div>
                </label>
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2.5 text-xs text-on-surface-variant">
                    <input className="size-4 accent-primary" type="checkbox" />
                    Stay signed in
                  </label>
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                {error && <div className="rounded-[var(--radius-control)] bg-error/10 px-3.5 py-2.5 text-xs text-error">{error}</div>}
                <div className="mt-1 flex justify-start">
                  <Button size="lg" className="min-w-32" type="submit" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                    <Icon className="text-[16px]">arrow_forward</Icon>
                  </Button>
                </div>
              </form>
              <div className="mt-8 border-t border-outline-variant/30 pt-5 text-xs text-on-surface-variant">
                Having trouble signing in? <a className="text-primary hover:underline" href="#">Contact your administrator</a>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex items-center gap-2.5 text-on-surface-variant/60">
            <Icon className="text-[15px]">lock</Icon>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em]">
              Internal workspace • Authorized personnel only
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
