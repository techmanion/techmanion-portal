import { ArrowLeft, Download, Pencil, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, Input, Loading, PageHeader, Select, StatusChip } from "../components/ui";
import { api, apiBlob } from "../lib/api";
import { formatDate, formatMoney, label } from "../lib/format";
import { Link, useEmployeeId } from "../router";
import type { Employee, EmployeeDocument } from "../types";

export function EmployeeDetailPage() {
  const employeeId = useEmployeeId();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [salary, setSalary] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function load() {
    api<Employee>(`/employees/${employeeId}`).then(setEmployee).catch((reason: Error) => setError(reason.message));
    api<EmployeeDocument[]>(`/employees/${employeeId}/documents`).then(setDocuments).catch(() => undefined);
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    try {
      await api(`/employees/${employeeId}/documents`, { method: "POST", body: formData });
      formElement.reset();
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

  useEffect(load, [employeeId]);

  async function reviseSalary(event: React.FormEvent) {
    event.preventDefault();
    setError("");
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

  if (!employee && !error) return <div className="screen-center"><Loading /></div>;
  if (!employee) return <Card><div className="empty-state">{error}</div></Card>;

  return (
    <>
      <Link to="/employees" className="back-link"><ArrowLeft size={16} /> Employees</Link>
      <PageHeader
        title={employee.fullName}
        description={`${employee.designation?.name ?? "No designation"} · ${employee.department?.name ?? "No department"}`}
        action={<Link to={`/employees/${employee.id}/edit`} className="button button-primary"><Pencil size={17} /> Edit employee</Link>}
      />
      <div className="detail-grid">
        <Card>
          <div className="section-title"><h2>Profile</h2><StatusChip value={employee.status} /></div>
          <dl className="detail-list">
            <div><dt>Email</dt><dd>{employee.email}</dd></div>
            <div><dt>Phone</dt><dd>{employee.phone}</dd></div>
            <div><dt>CNIC / ID</dt><dd>{employee.cnic}</dd></div>
            <div><dt>Employee type</dt><dd>{label(employee.employeeType)}</dd></div>
            <div><dt>Joining date</dt><dd>{formatDate(employee.joiningDate)}</dd></div>
            <div><dt>Probation end</dt><dd>{formatDate(employee.probationEndDate)}</dd></div>
            <div><dt>Address</dt><dd>{employee.address || "—"}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2>Compensation</h2>
          <div className="salary-amount">
            {employee.currentSalary
              ? formatMoney(employee.currentSalary.baseAmount, employee.currentSalary.currency)
              : "Not set"}
            <span>per month</span>
          </div>
          <form onSubmit={reviseSalary} className="compact-form">
            <Field label="Revised monthly amount">
              <Input type="number" min="0" value={salary} onChange={(e) => setSalary(e.target.value)} required />
            </Field>
            <Field label="Effective date">
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
            </Field>
            <Button type="submit">Add revision</Button>
          </form>
        </Card>
      </div>
      <Card>
        <h2>Documents</h2>
        {documents.length === 0 ? (
          <EmptyState>No documents uploaded.</EmptyState>
        ) : (
          <ul className="document-list">
            {documents.map((document) => (
              <li key={document.id}>
                <div><strong>{document.fileName}</strong><span>{label(document.kind)} · {Math.ceil(document.sizeBytes / 1024)} KB</span></div>
                <Button variant="text" onClick={() => downloadDocument(document)}><Download size={16} /> Download</Button>
              </li>
            ))}
          </ul>
        )}
        <form className="document-upload" onSubmit={uploadDocument}>
          <Field label="Document type">
            <Select name="kind" defaultValue="CV">
              {["CV", "CONTRACT", "ID_COPY", "CERTIFICATE", "OTHER"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </Select>
          </Field>
          <Field label="File"><Input name="file" type="file" required /></Field>
          <Button type="submit"><Upload size={17} /> Upload</Button>
        </form>
      </Card>
      {employee.accessLog && <Card><h2>Access log</h2><p className="body-copy">{employee.accessLog}</p></Card>}
      {error && <div className="form-error page-error">{error}</div>}
    </>
  );
}
