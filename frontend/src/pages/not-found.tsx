import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { Icon, Logo } from "../components/atoms";

export function NotFoundPage() {
  const { user } = useAuth();
  const destination = user ? "/home" : "/login";
  const destinationLabel = user ? "Back to home" : "Back to sign in";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background p-6 text-on-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="login-diagonal-bg absolute inset-0" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-10">
          <Logo />
        </div>

        <div className="surface-panel relative flex w-full max-w-[520px] flex-col items-center overflow-hidden px-8 py-14 sm:px-14">
          <span className="text-7xl font-bold tracking-[-0.03rem] text-on-surface sm:text-8xl">
            4<span className="text-brand-green">0</span>4
          </span>
          <h1 className="mt-4 text-xl font-semibold text-on-surface sm:text-2xl">
            This page doesn't exist
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
            The link may be broken, or the page may have moved. Check the address, or head back to
            somewhere that does exist.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={destination}
              className="inline-flex h-10 min-w-40 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 transition hover:brightness-105"
            >
              <Icon className="text-[18px]">arrow_back</Icon>
              {destinationLabel}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-on-surface-variant">© 2026 TECHMANION</p>
      </div>
    </main>
  );
}
