import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import { useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { UNAUTHORIZED_EVENT } from "./lib/api";
import { useToast } from "./toast";
import { CandidateConvertPage } from "./pages/candidate-convert";
import { CandidateDetailPage } from "./pages/candidate-detail";
import { CandidateFormPage } from "./pages/candidate-form";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { ExpenseFormPage } from "./pages/expense-form";
import { FinancePage } from "./pages/finance";
import { HiringPage } from "./pages/hiring";
import { ManagementPage } from "./pages/management";
import { HomePage } from "./pages/home";
import { JobFormPage } from "./pages/job-form";
import { JobDetailPage } from "./pages/job-detail";
import { LoginPage } from "./pages/login";
import { OrganizationPage } from "./pages/organization";
import { OrganizationFormPage } from "./pages/organization-form";
import { PayrollEntryFormPage } from "./pages/payroll-entry-form";
import { ProfilePage } from "./pages/profile";
import { ProjectDetailPage } from "./pages/project-detail";
import { ProjectFormPage } from "./pages/project-form";
import { ProjectsPage } from "./pages/projects";

function FullScreenLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loading />
    </div>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoading />;
  return user ? <AppShell /> : <Navigate to="/login" state={{ from: location }} replace />;
}

function RequireExecutive({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === "EXECUTIVE" ? <>{children}</> : <Navigate to="/home" replace />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoading />;
  if (user) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : "/home"} replace />;
  }
  return <LoginPage />;
}

export function App() {
  const toast = useToast();
  useDocumentTitle();

  useEffect(() => {
    function handleUnauthorized() {
      toast.error("Your session has expired. Please sign in again.");
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [toast]);

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/hiring" element={<HiringPage />} />
        <Route path="/hiring/jobs/new" element={<JobFormPage />} />
        <Route path="/hiring/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/hiring/jobs/:jobId/edit" element={<JobFormPage />} />
        <Route path="/hiring/candidates/new" element={<CandidateFormPage />} />
        <Route path="/hiring/candidates/:candidateId" element={<CandidateDetailPage />} />
        <Route path="/hiring/candidates/:candidateId/edit" element={<CandidateFormPage />} />
        <Route path="/hiring/candidates/:candidateId/convert" element={<CandidateConvertPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
        <Route path="/employees/:employeeId/edit" element={<EmployeeFormPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/projects/new"
          element={
            <RequireExecutive>
              <ProjectFormPage />
            </RequireExecutive>
          }
        />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route
          path="/projects/:projectId/edit"
          element={
            <RequireExecutive>
              <ProjectFormPage />
            </RequireExecutive>
          }
        />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/finance/expenses/new" element={<ExpenseFormPage />} />
        <Route path="/finance/expenses/:expenseId/edit" element={<ExpenseFormPage />} />
        <Route path="/finance/payroll/new" element={<PayrollEntryFormPage />} />
        <Route path="/finance/payroll/:entryId/edit" element={<PayrollEntryFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/organization"
          element={
            <RequireExecutive>
              <OrganizationPage />
            </RequireExecutive>
          }
        />
        <Route
          path="/organization/edit"
          element={
            <RequireExecutive>
              <OrganizationFormPage />
            </RequireExecutive>
          }
        />
        <Route
          path="/management"
          element={
            <RequireExecutive>
              <ManagementPage />
            </RequireExecutive>
          }
        />
        <Route path="/settings" element={<Navigate to="/management" replace />} />
        <Route path="/administration" element={<Navigate to="/management" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
