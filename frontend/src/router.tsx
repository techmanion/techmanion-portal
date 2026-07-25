import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

interface RouterValue {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo<RouterValue>(
    () => ({
      path,
      navigate: (to, options) => {
        if (options?.replace) window.history.replaceState(null, "", to);
        else window.history.pushState(null, "", to);
        setPath(to);
        window.scrollTo({ top: 0, behavior: "instant" });
      },
    }),
    [path],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const router = useContext(RouterContext);
  if (!router) throw new Error("Router hooks must be used inside RouterProvider");
  return router;
}

export function useNavigate() {
  return useRouter().navigate;
}

export function Link({
  to,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
      {...props}
    />
  );
}

export function NavLink({
  to,
  className,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
  to: string;
  className?: string | ((state: { isActive: boolean }) => string);
}) {
  const { path } = useRouter();
  const isActive = path === to || path.startsWith(`${to}/`);
  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;
  return <Link to={to} className={resolvedClass} {...props} />;
}

export function useEmployeeId(): string | undefined {
  const { path } = useRouter();
  return path.match(/^\/employees\/(\d+)/)?.[1];
}

export function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace: true }), [navigate, to]);
  return null;
}

