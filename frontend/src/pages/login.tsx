import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Logo } from "../components/atoms";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@techmanion.com");
  const [password, setPassword] = useState("12345678");
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
      <section className="hidden w-1/2 flex-col justify-between px-18 py-8 lg:flex">
        <Logo />
        <div className="-mt-36 flex flex-col gap-4">
          <p className="text-5xl font-bold leading-[1.25] tracking-[-0.01em] text-on-surface">
            One workspace for your people, projects, and operations.
          </p>
          <p className="max-w-md text-lg leading-6 text-on-surface-variant">
            Employees, payroll, projects and company operations, organized in one workspace.
          </p>
        </div>
        <div className="flex gap-5 text-xs text-on-surface-variant">
          <span>© 2026 TECHMANION</span>
          <a className="hover:text-primary" href="#">Privacy</a>
          <a className="hover:text-primary" href="#">Terms</a>
        </div>
      </section>

      <section className="flex flex-col min-h-screen w-full items-center justify-center p-6 sm:p-10 lg:w-1/2 lg:p-26">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="surface-panel relative flex w-full flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-14">

          <div className="relative z-10">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-6">
                <h2 className="mb-1.5 text-2xl md:text-4xl font-semibold text-on-surface">Welcome back</h2>
                <p className="text-sm text-on-surface-variant">Sign in with your company account</p>
              </div>
              <form className="flex flex-col gap-5" onSubmit={submit}>

                {error && <div className="rounded-[var(--radius-control)] bg-error/10 px-3.5 py-2.5 text-xs text-error">{error}</div>}
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
                <div className="flex justify-between px-1 mt-4">
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot password?</a>
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
        </div>
      </section>
    </main>
  );
}
