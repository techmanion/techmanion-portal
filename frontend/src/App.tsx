import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { CandidateConvertPage } from "./pages/candidate-convert";
import { CandidateFormPage } from "./pages/candidate-form";
import { EmployeeDetailPage } from "./pages/employee-detail";
import { EmployeeFormPage } from "./pages/employee-form";
import { EmployeesPage } from "./pages/employees";
import { HiringPage } from "./pages/hiring";
import { HomePage } from "./pages/home";
import { JobFormPage } from "./pages/job-form";
import { LoginPage } from "./pages/login";
import { PayrollEntryFormPage } from "./pages/payroll-entry-form";
import { PayrollPage } from "./pages/payroll";
import { ProfilePage } from "./pages/profile";
import { ProjectDetailPage } from "./pages/project-detail";
import { ProjectFormPage } from "./pages/project-form";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";
import { TeamMemberFormPage } from "./pages/team-member-form";
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
        <Route path="/hiring/jobs/:jobId/edit" element={<JobFormPage />} />
        <Route path="/hiring/candidates/new" element={<CandidateFormPage />} />
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
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/new" element={<PayrollEntryFormPage />} />
        <Route path="/payroll/:entryId/edit" element={<PayrollEntryFormPage />} />
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
          path="/team/new"
          element={
            <RequireAdmin>
              <TeamMemberFormPage />
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
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
