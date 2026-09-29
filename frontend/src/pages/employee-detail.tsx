import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loading } from "../components/atoms";
import { Breadcrumb, EmptyState } from "../components/molecules";
import {
  CompensationPanel,
  DocumentsPanel,
  EmployeeOverviewPanel,
  ProfileHeader,
} from "../components/organisms";
import {
  deleteDocument,
  downloadDocument,
  getEmployee,
  listEmployeeDocuments,
  reviseSalary,
  uploadEmployeeDocument,
} from "../lib/api/employees";
import { useToast } from "../toast";
import type { Employee, EmployeeDocument } from "../types";

const tabs = ["Overview", "Compensation", "Documents"];

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [salary, setSalary] = useState(0);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [commissionBasis, setCommissionBasis] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  function load() {
    getEmployee(employeeId!)
      .then(setEmployee)
      .catch((reason: Error) => setError(reason.message));
    listEmployeeDocuments(employeeId!)
      .then(setDocuments)
      .catch(() => undefined);
  }

  useEffect(load, [employeeId]);

  async function reviseSalaryEntry() {
    await reviseSalary(employeeId!, {
      baseAmount: salary,
      currency: employee?.currentSalary?.currency ?? "PKR",
      commissionRate,
      commissionBasis,
      effectiveDate,
      reason: "RATE_CHANGE",
    });
    setSalary(0);
    setCommissionRate(null);
    setCommissionBasis(null);
    load();
    toast.success("Compensation revised.");
  }

  async function uploadDocument(formData: FormData) {
    setError("");
    try {
      await uploadEmployeeDocument(employeeId!, formData);
      load();
      toast.success("Document uploaded.");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Document could not be uploaded.";
      setError(message);
      throw new Error(message, { cause: reason });
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

  async function handleViewDocument(document: EmployeeDocument) {
    const viewerTab = window.open("", "_blank");
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      if (viewerTab) viewerTab.location.href = url;
    } catch (reason) {
      viewerTab?.close();
      setError(reason instanceof Error ? reason.message : "Document could not be opened.");
    }
  }

  async function handleDeleteDocument(document: EmployeeDocument) {
    try {
      await deleteDocument(document.id);
      setDocuments((current) => current.filter((row) => row.id !== document.id));
      toast.success("Document deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be deleted.");
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
        <Breadcrumb to="/employees" trail={["Employees", employee.fullName]} />

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
          commissionRate={commissionRate}
          commissionBasis={commissionBasis}
          onSalaryChange={setSalary}
          onEffectiveDateChange={setEffectiveDate}
          onCommissionRateChange={setCommissionRate}
          onCommissionBasisChange={setCommissionBasis}
          onSubmit={reviseSalaryEntry}
        />
      )}

      {activeTab === "Documents" && (
        <DocumentsPanel
          documents={documents}
          onUpload={uploadDocument}
          onView={handleViewDocument}
          onDownload={handleDownloadDocument}
          onDelete={handleDeleteDocument}
        />
      )}
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
