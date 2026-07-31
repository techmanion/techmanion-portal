import { useState } from "react";
import { Button, Icon, Input } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { FormDialog, FormField, MoneyInput } from "../molecules";
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
  onSubmit: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit();
      setDialogOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Compensation could not be revised.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-panel mt-8 max-w-5xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <SectionHeading className="mb-6">Current Compensation</SectionHeading>
          <div className="text-2xl font-semibold text-on-surface">
            {employee.currentSalary
              ? formatMoney(employee.currentSalary.baseAmount, employee.currentSalary.currency)
              : "Not set"}
          </div>
          <span className="mt-1.5 block text-sm text-on-surface-variant">Fixed monthly salary</span>
        </div>
        <Button onClick={() => { setError(""); setDialogOpen(true); }}>
          <Icon className="text-[16px]">add</Icon>Add revision
        </Button>
      </div>

      <FormDialog
        open={dialogOpen}
        title="Add compensation revision"
        description={`Update ${employee.fullName}'s monthly compensation.`}
        icon="payments"
        submitLabel="Save revision"
        submitting={submitting}
        submitDisabled={salary <= 0}
        error={error}
        onSubmit={submit}
        onClose={() => { setDialogOpen(false); setError(""); }}
      >
        <FormField label="Revised monthly amount">
          <MoneyInput value={salary} onChange={onSalaryChange} required />
        </FormField>
        <FormField label="Effective date">
          <Input type="date" value={effectiveDate} onChange={(event) => onEffectiveDateChange(event.target.value)} required />
        </FormField>
      </FormDialog>
    </section>
  );
}
