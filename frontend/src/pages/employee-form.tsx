import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Icon, Input, Select, Textarea } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { FormField } from "../components/molecules";
import { api } from "../lib/api";
import { label } from "../lib/format";
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
  const { employeeId } = useParams();
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to={isEdit ? `/employees/${employeeId}` : "/employees"} className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
        <Icon className="text-[18px]">arrow_back</Icon> Employees
      </Link>
      <div className="mb-6">
        <h1 className="text-title font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-on-surface-variant">Personal, employment, and compensation details.</p>
      </div>
      <form onSubmit={submit} className="surface-panel space-y-8 p-6">
          <section>
          <SectionHeading className="mb-5">Personal details</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="First name"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></FormField>
            <FormField label="Last name"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></FormField>
            <FormField label="CNIC / ID"><Input value={form.cnic} onChange={(e) => set("cnic", e.target.value)} required /></FormField>
            <FormField label="Date of birth"><Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value || undefined)} /></FormField>
            <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></FormField>
            <FormField label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></FormField>
          </div>
          <FormField label="Address" className="mt-4"><Textarea value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></FormField>
          </section>
          <section className="border-t border-outline-variant/30 pt-7">
          <SectionHeading accent="tertiary" className="mb-5">Employment</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Type">
              <Select value={form.employeeType} onChange={(e) => set("employeeType", e.target.value as EmployeePayload["employeeType"])}>
                {["FULL_TIME", "PART_TIME", "CONTRACT"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as EmployeePayload["status"])}>
                {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </Select>
            </FormField>
            <FormField label="Department">
              <Select value={form.departmentId ?? ""} onChange={(e) => set("departmentId", Number(e.target.value) || undefined)}>
                <option value="">Select department</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Designation">
              <Select value={form.designationId ?? ""} onChange={(e) => set("designationId", Number(e.target.value) || undefined)}>
                <option value="">Select designation</option>
                {designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Joining date"><Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} required /></FormField>
            <FormField label="Probation end"><Input type="date" value={form.probationEndDate ?? ""} onChange={(e) => set("probationEndDate", e.target.value || undefined)} /></FormField>
          </div>
          </section>
          {!isEdit && (
            <section className="border-t border-outline-variant/30 pt-7">
              <SectionHeading className="mb-5">Compensation</SectionHeading>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Monthly salary" hint="Enter the amount in rupees; it is stored in minor units.">
                  <Input type="number" min="0" value={(form.baseAmount ?? 0) / 100} onChange={(e) => set("baseAmount", Math.round(Number(e.target.value) * 100))} required />
                </FormField>
                <FormField label="Currency"><Input value={form.currency ?? "PKR"} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} required /></FormField>
              </div>
            </section>
          )}
          <section className="border-t border-outline-variant/30 pt-7">
          <SectionHeading accent="tertiary" className="mb-5">Access and notes</SectionHeading>
          <FormField label="Account access log" hint="Record company email or Trello access issued.">
            <Textarea value={form.accessLog ?? ""} onChange={(e) => set("accessLog", e.target.value)} />
          </FormField>
          </section>
          {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
          <div className="flex items-center gap-3 border-t border-outline-variant/30 pt-6">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
            <Link to={isEdit ? `/employees/${employeeId}` : "/employees"} className="inline-flex h-9 items-center rounded-full px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high">Cancel</Link>
          </div>
      </form>
    </div>
  );
}
