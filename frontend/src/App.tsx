import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { CandidateConvertPage } from "./pages/candidate-convert";
import { CandidateDetailPage } from "./pages/candidate-detail";
import { CandidateFormPage } from "./pages/candidate-form";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { ExpenseFormPage } from "./pages/expense-form";
import { FinancePage } from "./pages/finance";
import { HiringPage } from "./pages/hiring";
import { AdministrationPage } from "./pages/administration";
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
  return user?.role === "ADMIN" ? <>{children}</> : <Navigate to="/home" replace />;
}

export function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
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
            <RequireAdmin>
              <ProjectFormPage />
            </RequireAdmin>
          }
        />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route
          path="/projects/:projectId/edit"
          element={
            <RequireAdmin>
              <ProjectFormPage />
            </RequireAdmin>
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
            <RequireAdmin>
              <OrganizationPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/organization/edit"
          element={
            <RequireAdmin>
              <OrganizationFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/administration"
          element={
            <RequireAdmin>
              <AdministrationPage />
            </RequireAdmin>
          }
        />
        <Route path="/settings" element={<Navigate to="/administration" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
