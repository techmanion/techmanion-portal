import { Button, Input, Select } from "../atoms";
import { FormField, MoneyInput } from "../molecules";
import { label } from "../../lib/format";
import { EMPLOYEE_TYPES } from "../../lib/options";
import type { ConvertToEmployeePayload, NamedOption } from "../../types";

export function ConvertCandidateFormPanel({
  form,
  designations,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: ConvertToEmployeePayload;
  designations: NamedOption[];
  onChange: (form: ConvertToEmployeePayload) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
      onSubmit={onSubmit}
    >
      <FormField label="Employment type">
        <Select
          value={form.employeeType}
          onChange={(event) =>
            onChange({
              ...form,
              employeeType: event.target.value as ConvertToEmployeePayload["employeeType"],
            })
          }
        >
          {EMPLOYEE_TYPES.map((value) => (
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
          onChange={(event) => onChange({ ...form, joiningDate: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Job title">
        <Select
          value={form.designationId ?? ""}
          onChange={(event) =>
            onChange({ ...form, designationId: Number(event.target.value) || undefined })
          }
        >
          <option value="">Select job title</option>
          {designations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Monthly compensation">
        <MoneyInput
          value={form.baseAmount ?? 0}
          onChange={(value) => onChange({ ...form, baseAmount: value })}
          required
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
      <div className="flex items-end gap-2.5">
        <Button type="submit">Convert to employee</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
