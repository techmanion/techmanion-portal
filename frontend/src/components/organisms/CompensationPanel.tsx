import { Button, Input } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { FormField, MoneyInput } from "../molecules";
import { formatMoney } from "../../lib/format";
import type { Employee } from "../../types";

export function CompensationPanel({
  employee,
  salary,
  effectiveDate,
  onSalaryChange,
  onEffectiveDateChange,
  onSubmit,
}: {
  employee: Employee;
  salary: number;
  effectiveDate: string;
  onSalaryChange: (value: number) => void;
  onEffectiveDateChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
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
      <form onSubmit={onSubmit} className="surface-panel p-6">
        <SectionHeading accent="tertiary" className="mb-6">
          Add Revision
        </SectionHeading>
        <div className="space-y-4">
          <FormField label="Revised monthly amount">
            <MoneyInput value={salary} onChange={onSalaryChange} required />
          </FormField>
          <FormField label="Effective date">
            <Input
              type="date"
              value={effectiveDate}
              onChange={(event) => onEffectiveDateChange(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit">Save revision</Button>
        </div>
      </form>
    </div>
  );
}
