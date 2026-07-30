import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Input, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { listEmployees } from "../lib/api/employees";
import {
  createPayrollEntry,
  getPayrollEntry,
  updatePayrollEntry,
} from "../lib/api/payroll";
import { useToast } from "../toast";
import type { Employee } from "../types";

interface PayrollFormState {
  employeeId: string;
  baseCompensation: string;
  adjustment: string;
  currency: string;
  notes: string;
}

const emptyForm: PayrollFormState = {
  employeeId: "",
  baseCompensation: "",
  adjustment: "0",
  currency: "PKR",
  notes: "",
};

export function PayrollEntryFormPage() {
  const { entryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(entryId);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [form, setForm] = useState<PayrollFormState>(emptyForm);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    listEmployees("").then(setEmployees).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (entryId) {
      getPayrollEntry(month, Number(entryId)).then((entry) => {
        if (!entry) return;
        setForm({
          employeeId: String(entry.employeeId),
          baseCompensation: String(entry.baseCompensation / 100),
          adjustment: String(entry.adjustment / 100),
          currency: entry.currency,
          notes: entry.notes ?? "",
        });
      });
    }
  }, [entryId, month]);

  const title = useMemo(() => (isEdit ? "Edit entry" : "Add entry"), [isEdit]);
  const cancelTo = `/payroll?month=${month}`;

  function set<K extends keyof PayrollFormState>(key: K, value: PayrollFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await updatePayrollEntry(Number(entryId), {
          baseCompensation: Math.round(Number(form.baseCompensation || 0) * 100),
          adjustment: Math.round(Number(form.adjustment || 0) * 100),
          currency: form.currency,
          notes: form.notes || null,
        });
        toast.success("Payroll entry updated.");
      } else {
        await createPayrollEntry({
          employeeId: Number(form.employeeId),
          month,
          baseCompensation: Math.round(Number(form.baseCompensation || 0) * 100),
          adjustment: Math.round(Number(form.adjustment || 0) * 100),
          currency: form.currency,
          notes: form.notes || null,
        });
        toast.success("Payroll entry added.");
      }
      navigate(cancelTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={["Payroll", title]}
      title={title}
      description="Compensation and adjustments for this payroll cycle."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Add entry"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Entry details" bordered={false}>
        <FormField label="Employee">
          <Select
            value={form.employeeId}
            onChange={(event) => set("employeeId", event.target.value)}
            disabled={isEdit}
            required
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Base compensation">
          <Input
            type="number"
            min="0"
            value={form.baseCompensation}
            onChange={(event) => set("baseCompensation", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Adjustment" hint="Negative values are deductions">
          <Input
            type="number"
            value={form.adjustment}
            onChange={(event) => set("adjustment", event.target.value)}
          />
        </FormField>
        <FormField label="Currency">
          <Input
            value={form.currency}
            maxLength={3}
            onChange={(event) => set("currency", event.target.value.toUpperCase())}
            required
          />
        </FormField>
      </FormSection>

      <FormSection heading="Notes" accent="tertiary">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
