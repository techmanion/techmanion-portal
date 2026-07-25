import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <AppHeader onLogout={logout} />
      <Sidebar />
      <main className="portal-main min-h-screen pt-16 lg:pl-60">
        <Outlet />
      </main>
    </div>
  );
}
