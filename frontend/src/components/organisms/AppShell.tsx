import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <AppHeader onLogout={logout} onMenuClick={() => setSidebarOpen((current) => !current)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="portal-main min-h-screen pt-16 pl-55">
        <Outlet />
      </main>
    </div>
  );
}
