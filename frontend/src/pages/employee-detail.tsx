import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon, Loading } from "../components/atoms";
import { EmptyState } from "../components/molecules";
import {
  CompensationPanel,
  DocumentsPanel,
  EmployeeOverviewPanel,
  ProfileHeader,
} from "../components/organisms";
import {
  downloadDocument,
  getEmployee,
  listEmployeeDocuments,
  reviseSalary,
  uploadEmployeeDocument,
} from "../lib/api/employees";
import type { Employee, EmployeeDocument } from "../types";

const tabs = ["Overview", "Compensation", "Documents"];

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [salary, setSalary] = useState(0);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function load() {
    getEmployee(employeeId!)
      .then(setEmployee)
      .catch((reason: Error) => setError(reason.message));
    listEmployeeDocuments(employeeId!)
      .then(setDocuments)
      .catch(() => undefined);
  }

  useEffect(load, [employeeId]);

  async function reviseSalaryEntry(event: React.FormEvent) {
    event.preventDefault();
    try {
      await reviseSalary(employeeId!, {
        baseAmount: salary,
        currency: employee?.currentSalary?.currency ?? "PKR",
        effectiveDate,
        reason: "RATE_CHANGE",
      });
      setSalary(0);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Salary could not be revised.");
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await uploadEmployeeDocument(employeeId!, new FormData(form));
      form.reset();
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be uploaded.");
    }
  }

  async function handleDownloadDocument(document: EmployeeDocument) {
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be downloaded.");
    }
  }

  if (!employee && !error) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loading />
      </div>
    );
  }
  if (!employee) {
    return (
      <div className="p-6">
        <EmptyState>{error}</EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <div className="mb-7">
        <Link
          to="/employees"
          className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-on-surface-variant hover:text-primary"
        >
          <Icon className="text-[18px]">arrow_back</Icon>
          Employees / {employee.fullName}
        </Link>

        <ProfileHeader employee={employee} />
      </div>

      <nav className="flex gap-8 overflow-x-auto border-b border-outline-variant/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative whitespace-nowrap pb-3 text-sm font-medium tracking-wide transition ${
              activeTab === tab ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" && <EmployeeOverviewPanel employee={employee} />}

      {activeTab === "Compensation" && (
        <CompensationPanel
          employee={employee}
          salary={salary}
          effectiveDate={effectiveDate}
          onSalaryChange={setSalary}
          onEffectiveDateChange={setEffectiveDate}
          onSubmit={reviseSalaryEntry}
        />
      )}

      {activeTab === "Documents" && (
        <DocumentsPanel
          documents={documents}
          onUpload={uploadDocument}
          onDownload={handleDownloadDocument}
        />
      )}
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
