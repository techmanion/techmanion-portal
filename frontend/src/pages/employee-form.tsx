import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Icon, Input, Select } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { FormField, MoneyInput } from "../components/molecules";
import { createEmployee, getEmployee, updateEmployee } from "../lib/api/employees";
import { listDesignations } from "../lib/api/settings";
import { label } from "../lib/format";
import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "../lib/options";
import type { Employee, EmployeePayload, NamedOption } from "../types";

const emptyEmployee: EmployeePayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeType: "FULL_TIME",
  status: "ACTIVE",
  joiningDate: new Date().toISOString().slice(0, 10),
  baseAmount: 0,
  currency: "PKR",
};

export function EmployeeFormPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(employeeId);
  const [form, setForm] = useState<EmployeePayload>(emptyEmployee);
  const [fullName, setFullName] = useState("");
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDesignations().then(setDesignations);
    if (employeeId) {
      getEmployee(employeeId).then((employee: Employee) => {
        setFullName(employee.fullName);
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          employeeType: employee.employeeType,
          status: employee.status,
          designationId: employee.designationId,
          joiningDate: employee.joiningDate,
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
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      const payload = { ...form, firstName: firstName ?? "", lastName: rest.join(" ") };
      if (isEdit) {
        delete payload.baseAmount;
        delete payload.currency;
        const saved = await updateEmployee(employeeId!, payload);
        navigate(`/employees/${saved.id}`);
      } else {
        const saved = await createEmployee(payload);
        navigate(`/employees/${saved.id}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        to={isEdit ? `/employees/${employeeId}` : "/employees"}
        className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary"
      >
        <Icon className="text-[18px]">arrow_back</Icon> Employees
      </Link>
      <div className="mb-6">
        <h1 className="text-title font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-on-surface-variant">
          Contact, employment, and compensation details.
        </p>
      </div>
      <form onSubmit={submit} className="surface-panel space-y-8 p-6">
        <section>
          <SectionHeading className="mb-5">Contact details</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" className="md:col-span-2">
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} required />
            </FormField>
          </div>
        </section>
        <section className="border-t border-outline-variant/30 pt-7">
          <SectionHeading accent="tertiary" className="mb-5">
            Employment
          </SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Job title">
              <Select
                value={form.designationId ?? ""}
                onChange={(event) => set("designationId", Number(event.target.value) || undefined)}
              >
                <option value="">Select job title</option>
                {designations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Employment type">
              <Select
                value={form.employeeType}
                onChange={(event) =>
                  set("employeeType", event.target.value as EmployeePayload["employeeType"])
                }
              >
                {EMPLOYEE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(event) => set("status", event.target.value as EmployeePayload["status"])}
              >
                {EMPLOYEE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Joining date">
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(event) => set("joiningDate", event.target.value)}
                required
              />
            </FormField>
          </div>
        </section>
        {!isEdit && (
          <section className="border-t border-outline-variant/30 pt-7">
            <SectionHeading className="mb-5">Compensation</SectionHeading>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Monthly compensation"
                hint="Enter the amount in rupees; it is stored in minor units."
              >
                <MoneyInput
                  value={form.baseAmount ?? 0}
                  onChange={(value) => set("baseAmount", value)}
                  required
                />
              </FormField>
              <FormField label="Currency">
                <Input
                  value={form.currency ?? "PKR"}
                  maxLength={3}
                  onChange={(event) => set("currency", event.target.value.toUpperCase())}
                  required
                />
              </FormField>
            </div>
          </section>
        )}
        {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
        <div className="flex items-center gap-3 border-t border-outline-variant/30 pt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
          <Link
            to={isEdit ? `/employees/${employeeId}` : "/employees"}
            className="inline-flex h-9 items-center rounded-full px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
