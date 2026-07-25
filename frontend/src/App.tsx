import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { LoginPage } from "./pages/login";
import { PayrollPage } from "./pages/payroll";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";

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

export function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/employees" replace /> : <LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
        <Route path="/employees/:employeeId/edit" element={<EmployeeFormPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/employees" replace />} />
    </Routes>
  );
}
