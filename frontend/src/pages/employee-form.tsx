import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../components/atoms";
import { FormField, FormSection, MoneyInput } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { createEmployee, getEmployee, updateEmployee } from "../lib/api/employees";
import { listDesignations } from "../lib/api/settings";
import { label } from "../lib/format";
import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "../lib/options";
import { useToast } from "../toast";
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
  const toast = useToast();

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
  const cancelTo = isEdit ? `/employees/${employeeId}` : "/employees";

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
        toast.success("Employee updated.");
      } else {
        const saved = await createEmployee(payload);
        navigate(`/employees/${saved.id}`);
        toast.success("Employee created.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={isEdit ? ["Employees", fullName || "Employee", "Edit"] : ["Employees", "Add employee"]}
      title={title}
      description="Contact, employment, and compensation details."
      onSubmit={submit}
      submitLabel="Save changes"
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Contact details" bordered={false}>
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
      </FormSection>

      <FormSection heading="Employment" accent="tertiary">
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
            onChange={(event) => set("employeeType", event.target.value as EmployeePayload["employeeType"])}
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
      </FormSection>

      {!isEdit && (
        <FormSection heading="Compensation">
          <FormField
            label="Monthly compensation"
            hint="Enter the amount in rupees; it is stored in minor units."
          >
            <MoneyInput value={form.baseAmount ?? 0} onChange={(value) => set("baseAmount", value)} required />
          </FormField>
          <FormField label="Currency">
            <Input
              value={form.currency ?? "PKR"}
              maxLength={3}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              required
            />
          </FormField>
        </FormSection>
      )}
    </FormPage>
  );
}
