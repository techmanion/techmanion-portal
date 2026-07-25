import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Icon, Input, Loading, Select } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState, FormField } from "../components/molecules";
import { ProfileHeader } from "../components/organisms";
import { api, apiBlob } from "../lib/api";
import { formatDate, formatMoney, label } from "../lib/format";
import type { Employee, EmployeeDocument } from "../types";

const portrait =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYo5IyKq4X8hfKEl_lkeW-e4U74MqO7VViu1lZQZnpmCvl2hw6iIqQOujI6lxBlLMLvShIJFap-cIWldvcvh0vuvecQLFajBM2vTH3uNSlcCc9ElT5ZdUXIPWWxUPQReCkAL1oNV6ZFctqgdwpPTDlSZuVjOE_rnENYw0NjZ9gbcHu6PIrhwDk1eJLJeyMeHGS1Be8IzuPyj1OW8g25gkrQYHPSHg0kKjY64ZoEHdM7MXmNBA_CcbfbERyHcZYSOOpF9ifdksLr3b5";

const tabs = ["Overview", "Employment", "Compensation", "Documents", "Projects", "Activity"];

function Definition({
  labelText,
  children,
  wide = false,
}: {
  labelText: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
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
    const blob = await apiBlob(`/documents/${document.id}/download`);
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
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

        <ProfileHeader employee={employee} portrait={portrait} />
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
        <div className="mt-8 grid grid-cols-12 gap-8">
          <div className="col-span-12 xl:col-span-8">
            <section className="border-b border-outline-variant/50 pb-9">
              <SectionHeading className="mb-6">Personal Information</SectionHeading>
              <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                <Definition labelText="Full name">{employee.fullName}</Definition>
                <Definition labelText="CNIC / ID number">{employee.cnic}</Definition>
                <Definition labelText="Date of birth">{formatDate(employee.dateOfBirth)}</Definition>
                <Definition labelText="Phone">{employee.phone}</Definition>
                <Definition labelText="Personal email">{employee.email}</Definition>
                <Definition labelText="Emergency contact">
                  {employee.emergencyContactName
                    ? `${employee.emergencyContactName} • ${employee.emergencyContactPhone ?? ""}`
                    : "—"}
                </Definition>
                <Definition labelText="Address" wide>{employee.address || "—"}</Definition>
              </dl>
            </section>

            <section className="pt-9">
              <SectionHeading accent="tertiary" className="mb-6">Employment Information</SectionHeading>
              <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                <Definition labelText="Department">{employee.department?.name ?? "—"}</Definition>
                <Definition labelText="Reporting manager">Sarah Jenkins (VP Engineering)</Definition>
                <Definition labelText="Designation">{employee.designation?.name ?? "—"}</Definition>
                <Definition labelText="Employment type">{label(employee.employeeType)}</Definition>
                <Definition labelText="Joining date">{formatDate(employee.joiningDate)}</Definition>
                <Definition labelText="Current status">
                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-green-500" />On-duty</span>
                </Definition>
              </dl>
            </section>
          </div>

          <aside className="col-span-12 xl:col-span-4">
            <div className="surface-panel p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-heading font-medium">Project Allocation</h2>
                <span className="text-sm font-medium text-primary">100%</span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <div><strong className="block">Project Atlas</strong><span className="text-xs text-on-surface-variant">Backend Engineer</span></div>
                    <span>70%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container-highest"><div className="h-1.5 w-[70%] rounded-full bg-primary" /></div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <div><strong className="block">Internal Platform</strong><span className="text-xs text-on-surface-variant">Technical Advisor</span></div>
                    <span>30%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container-highest"><div className="h-1.5 w-[30%] rounded-full bg-tertiary" /></div>
                </div>
              </div>
              <div className="mt-8 flex gap-3 rounded-2xl bg-surface-container-high p-4 text-xs leading-6 text-on-surface-variant">
                <Icon className="shrink-0 text-[18px] text-primary">info</Icon>
                {employee.firstName} is currently contributing across active company projects.
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="surface-panel p-5">
                <Icon className="text-[22px]">timer</Icon>
                <strong className="mt-4 block text-xl">98%</strong>
                <span className="mt-1.5 block text-[11px] uppercase tracking-wider text-on-surface-variant">Attendance</span>
              </div>
              <div className="surface-panel p-5">
                <Icon className="text-[22px]">star</Icon>
                <strong className="mt-4 block text-xl">4.9</strong>
                <span className="mt-1.5 block text-[11px] uppercase tracking-wider text-on-surface-variant">Performance</span>
              </div>
            </div>
          </aside>
        </div>
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

      {!["Overview", "Compensation", "Documents"].includes(activeTab) && (
        <div className="surface-panel mt-8"><EmptyState>{activeTab} details will appear here.</EmptyState></div>
      )}
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
