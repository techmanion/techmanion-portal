import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { LoginPage } from "./pages/login";
import { OverviewPage } from "./pages/overview";
import { PayrollPage } from "./pages/payroll";
import { ProfilePage } from "./pages/profile";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";
import { TeamPage } from "./pages/team";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loading />
      </div>
    );
  }
  return user ? <AppShell /> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <>{children}</> : <Navigate to="/overview" replace />;
}

export function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/overview" replace /> : <LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
        <Route path="/employees/:employeeId/edit" element={<EmployeeFormPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/team"
          element={
            <RequireAdmin>
              <TeamPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAdmin>
              <SettingsPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
