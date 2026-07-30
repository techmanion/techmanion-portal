import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Icon, Input, Loading, Select } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState, FormField } from "../components/molecules";
import { ProfileHeader } from "../components/organisms";
import { api, apiBlob } from "../lib/api";
import { formatDate, formatMoney, label } from "../lib/format";
import type { Employee, EmployeeDocument } from "../types";

const tabs = ["Overview", "Compensation", "Documents"];

function Definition({
  labelText,
  children,
}: {
  labelText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
        {labelText}
      </dt>
      <dd className="m-0 text-sm leading-6 text-on-surface">{children}</dd>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [salary, setSalary] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function load() {
    api<Employee>(`/employees/${employeeId}`)
      .then(setEmployee)
      .catch((reason: Error) => setError(reason.message));
    api<EmployeeDocument[]>(`/employees/${employeeId}/documents`)
      .then(setDocuments)
      .catch(() => undefined);
  }

  useEffect(load, [employeeId]);

  async function reviseSalary(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(`/employees/${employeeId}/salary`, {
        method: "POST",
        body: JSON.stringify({
          baseAmount: Math.round(Number(salary) * 100),
          currency: employee?.currentSalary?.currency ?? "PKR",
          effectiveDate,
          reason: "RATE_CHANGE",
        }),
      });
      setSalary("");
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Salary could not be revised.");
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await api(`/employees/${employeeId}/documents`, {
        method: "POST",
        body: new FormData(form),
      });
      form.reset();
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be uploaded.");
    }
  }

  async function downloadDocument(document: EmployeeDocument) {
    try {
      const blob = await apiBlob(`/documents/${document.id}/download`);
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
    return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  }
  if (!employee) {
    return <div className="p-6"><EmptyState>{error}</EmptyState></div>;
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
            {activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" && (
        <section className="surface-panel mt-8 max-w-5xl p-6">
          <SectionHeading className="mb-6">Employee Information</SectionHeading>
          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <Definition labelText="Full name">{employee.fullName}</Definition>
            <Definition labelText="Email">{employee.email}</Definition>
            <Definition labelText="Phone">{employee.phone}</Definition>
            <Definition labelText="Job title">{employee.designation?.name ?? "—"}</Definition>
            <Definition labelText="Employment type">{label(employee.employeeType)}</Definition>
            <Definition labelText="Status">
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-green-500" />{label(employee.status)}</span>
            </Definition>
            <Definition labelText="Joining date">{formatDate(employee.joiningDate)}</Definition>
          </dl>
        </section>
      )}

      {activeTab === "Compensation" && (
        <div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
          <section className="surface-panel p-6">
            <SectionHeading className="mb-6">Current Compensation</SectionHeading>
            <div className="text-2xl font-semibold text-on-surface">
              {employee.currentSalary
                ? formatMoney(employee.currentSalary.baseAmount, employee.currentSalary.currency)
                : "Not set"}
            </div>
            <span className="mt-1.5 block text-sm text-on-surface-variant">Fixed monthly salary</span>
          </section>
          <form onSubmit={reviseSalary} className="surface-panel p-6">
            <SectionHeading accent="tertiary" className="mb-6">Add Revision</SectionHeading>
            <div className="space-y-4">
              <FormField label="Revised monthly amount"><Input type="number" min="0" value={salary} onChange={(event) => setSalary(event.target.value)} required /></FormField>
              <FormField label="Effective date"><Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} required /></FormField>
              <Button type="submit">Save revision</Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "Documents" && (
        <div className="surface-panel mt-8 max-w-5xl p-6">
          <SectionHeading className="mb-6">Employee Documents</SectionHeading>
          {documents.length ? (
            <ul className="divide-y divide-outline-variant/30">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-surface-container-highest"><Icon className="text-[18px]">description</Icon></span>
                    <div><strong className="block text-sm">{document.fileName}</strong><span className="text-xs text-on-surface-variant">{label(document.kind)} · {Math.ceil(document.sizeBytes / 1024)} KB</span></div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => downloadDocument(document)}><Icon className="text-[16px]">download</Icon>Download</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState>No documents uploaded.</EmptyState>}
          <form className="mt-6 grid items-end gap-4 border-t border-outline-variant/30 pt-6 md:grid-cols-[180px_1fr_auto]" onSubmit={uploadDocument}>
            <FormField label="Document type"><Select name="kind" defaultValue="CV">{["CV", "CONTRACT", "ID_COPY", "CERTIFICATE", "OTHER"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select></FormField>
            <FormField label="File"><Input name="file" type="file" required /></FormField>
            <Button type="submit"><Icon className="text-[16px]">upload</Icon>Upload</Button>
          </form>
        </div>
      )}
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
