import { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, Input, PageHeader, Select } from "../components/ui";
import { api } from "../lib/api";
import { label } from "../lib/format";
import { Link, useEmployeeId, useNavigate } from "../router";
import type { Employee, EmployeePayload, NamedOption } from "../types";

const emptyEmployee: EmployeePayload = {
  firstName: "",
  lastName: "",
  cnic: "",
  email: "",
  phone: "",
  employeeType: "FULL_TIME",
  status: "ACTIVE",
  compensationType: "FIXED",
  joiningDate: new Date().toISOString().slice(0, 10),
  baseAmount: 0,
  currency: "PKR",
};

export function EmployeeFormPage() {
  const employeeId = useEmployeeId();
  const navigate = useNavigate();
  const isEdit = Boolean(employeeId);
  const [form, setForm] = useState<EmployeePayload>(emptyEmployee);
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<NamedOption[]>("/settings/departments"),
      api<NamedOption[]>("/settings/designations"),
    ]).then(([departmentRows, designationRows]) => {
      setDepartments(departmentRows);
      setDesignations(designationRows);
    });
    if (employeeId) {
      api<Employee>(`/employees/${employeeId}`).then((employee) => {
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          cnic: employee.cnic,
          dateOfBirth: employee.dateOfBirth,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          emergencyContactName: employee.emergencyContactName,
          emergencyContactPhone: employee.emergencyContactPhone,
          employeeType: employee.employeeType,
          status: employee.status,
          compensationType: employee.compensationType,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          joiningDate: employee.joiningDate,
          probationEndDate: employee.probationEndDate,
          confirmationDate: employee.confirmationDate,
          accessLog: employee.accessLog,
        });
      });
    }
  }, [employeeId]);

  const title = useMemo(() => (isEdit ? "Edit employee" : "Add employee"), [isEdit]);

  function set<K extends keyof EmployeePayload>(key: K, value: EmployeePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const path = isEdit ? `/employees/${employeeId}` : "/employees";
      const method = isEdit ? "PUT" : "POST";
      const payload = { ...form };
      if (isEdit) {
        delete payload.baseAmount;
        delete payload.currency;
      }
      const saved = await api<Employee>(path, { method, body: JSON.stringify(payload) });
      navigate(`/employees/${saved.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={title} description="Personal, employment, and compensation details." />
      <Card>
        <form onSubmit={submit} className="form-page">
          <h2>Personal details</h2>
          <div className="form-grid">
            <Field label="First name"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></Field>
            <Field label="Last name"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></Field>
            <Field label="CNIC / ID"><Input value={form.cnic} onChange={(e) => set("cnic", e.target.value)} required /></Field>
            <Field label="Date of birth"><Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value || undefined)} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></Field>
          </div>
          <Field label="Address"><textarea className="input textarea" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <h2>Employment</h2>
          <div className="form-grid">
            <Field label="Type">
              <Select value={form.employeeType} onChange={(e) => set("employeeType", e.target.value as EmployeePayload["employeeType"])}>
                {["FULL_TIME", "PART_TIME", "CONTRACT"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as EmployeePayload["status"])}>
                {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.departmentId ?? ""} onChange={(e) => set("departmentId", Number(e.target.value) || undefined)}>
                <option value="">Select department</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Designation">
              <Select value={form.designationId ?? ""} onChange={(e) => set("designationId", Number(e.target.value) || undefined)}>
                <option value="">Select designation</option>
                {designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Joining date"><Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} required /></Field>
            <Field label="Probation end"><Input type="date" value={form.probationEndDate ?? ""} onChange={(e) => set("probationEndDate", e.target.value || undefined)} /></Field>
          </div>
          {!isEdit && (
            <>
              <h2>Compensation</h2>
              <div className="form-grid">
                <Field label="Monthly salary" hint="Enter the amount in rupees; it is stored in minor units.">
                  <Input type="number" min="0" value={(form.baseAmount ?? 0) / 100} onChange={(e) => set("baseAmount", Math.round(Number(e.target.value) * 100))} required />
                </Field>
                <Field label="Currency"><Input value={form.currency ?? "PKR"} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} required /></Field>
              </div>
            </>
          )}
          <h2>Access and notes</h2>
          <Field label="Account access log" hint="Record company email or Trello access issued.">
            <textarea className="input textarea" value={form.accessLog ?? ""} onChange={(e) => set("accessLog", e.target.value)} />
          </Field>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
            <Link to={isEdit ? `/employees/${employeeId}` : "/employees"} className="button button-outline">Cancel</Link>
          </div>
        </form>
      </Card>
    </>
  );
}
