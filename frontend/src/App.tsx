import { useAuth } from "./auth";
import { AppShell } from "./components/app-shell";
import { Loading } from "./components/ui";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { LoginPage } from "./pages/login";
import { PayrollPage } from "./pages/payroll";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";
import { Redirect, useRouter } from "./router";

function PageForPath({ path }: { path: string }) {
  if (path === "/employees/new") return <EmployeeFormPage />;
  if (/^\/employees\/\d+\/edit$/.test(path)) return <EmployeeFormPage />;
  if (/^\/employees\/\d+$/.test(path)) return <EmployeeDetailPage />;
  if (path === "/employees") return <EmployeesPage />;
  if (path === "/payroll") return <PayrollPage />;
  if (path === "/projects") return <ProjectsPage />;
  if (path === "/settings") return <SettingsPage />;
  return <Redirect to="/employees" />;
}

export function App() {
  const { user, loading } = useAuth();
  const { path } = useRouter();
  if (loading) return <div className="screen-center"><Loading /></div>;
  if (!user) return path === "/login" ? <LoginPage /> : <Redirect to="/login" />;
  if (path === "/login") return <Redirect to="/employees" />;
  return <AppShell><PageForPath path={path} /></AppShell>;
}
