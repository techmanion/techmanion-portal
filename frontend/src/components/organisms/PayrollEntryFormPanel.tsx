import { Button, Input, Select, Textarea } from "../atoms";
import { FormField } from "../molecules/FormField";
import type { Employee } from "../../types";

export interface PayrollFormState {
  employeeId: string;
  baseCompensation: string;
  adjustment: string;
  currency: string;
  notes: string;
}

export function PayrollEntryFormPanel({
  form,
  employees,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: PayrollFormState;
  employees: Employee[];
  editing: boolean;
  onChange: (form: PayrollFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
      onSubmit={onSubmit}
    >
      <FormField label="Employee">
        <Select
          value={form.employeeId}
          onChange={(event) => onChange({ ...form, employeeId: event.target.value })}
          disabled={editing}
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
          onChange={(event) => onChange({ ...form, baseCompensation: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Adjustment" hint="Negative values are deductions">
        <Input
          type="number"
          value={form.adjustment}
          onChange={(event) => onChange({ ...form, adjustment: event.target.value })}
        />
      </FormField>
      <FormField label="Currency">
        <Input
          value={form.currency}
          maxLength={3}
          onChange={(event) => onChange({ ...form, currency: event.target.value.toUpperCase() })}
          required
        />
      </FormField>
      <FormField label="Notes" className="md:col-span-2 xl:col-span-3">
        <Textarea
          value={form.notes}
          onChange={(event) => onChange({ ...form, notes: event.target.value })}
        />
      </FormField>
      <div className="flex gap-2.5 md:col-span-2 xl:col-span-3">
        <Button type="submit">{editing ? "Save changes" : "Add entry"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
