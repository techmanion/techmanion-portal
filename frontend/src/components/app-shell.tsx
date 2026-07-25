import { BriefcaseBusiness, LogOut, ReceiptText, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../auth";
import { NavLink } from "../router";

const navigation = [
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/payroll", label: "Payroll", icon: ReceiptText },
  { to: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Techmanion</div>
        <nav>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={20} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}
