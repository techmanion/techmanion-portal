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
  commissionRate,
  commissionBasis,
  onSalaryChange,
  onEffectiveDateChange,
  onCommissionRateChange,
  onCommissionBasisChange,
  onSubmit,
}: {
  employee: Employee;
  salary: number;
  effectiveDate: string;
  commissionRate: number | null;
  commissionBasis: string | null;
  onSalaryChange: (value: number) => void;
  onEffectiveDateChange: (value: string) => void;
  onCommissionRateChange: (value: number | null) => void;
  onCommissionBasisChange: (value: string | null) => void;
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
          {employee.currentSalary?.commissionRate != null && (
            <span className="mt-1 block text-sm text-on-surface-variant">
              Commission: {employee.currentSalary.commissionRate}%
              {employee.currentSalary.commissionBasis ? ` · ${employee.currentSalary.commissionBasis}` : ""}
            </span>
          )}
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
        {employee.compensationType === "COMMISSION" && (
          <>
            <FormField label="Commission rate" hint="Percentage, e.g. 5 for 5%.">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionRate ?? ""}
                onChange={(event) => onCommissionRateChange(event.target.value === "" ? null : Number(event.target.value))}
              />
            </FormField>
            <FormField label="Commission basis" hint="e.g. % of closed deal value.">
              <Input
                value={commissionBasis ?? ""}
                onChange={(event) => onCommissionBasisChange(event.target.value || null)}
              />
            </FormField>
          </>
        )}
      </FormDialog>
    </section>
  );
}
