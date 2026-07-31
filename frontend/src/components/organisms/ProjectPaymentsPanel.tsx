import { useState } from "react";
import { Button, Icon, IconButton, Input, Textarea } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState, FormDialog, FormField, MoneyInput } from "../molecules";
import { formatDate, formatMoney } from "../../lib/format";
import type { Project, ProjectPaymentPayload } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

const emptyPayment = (): ProjectPaymentPayload => ({
  amount: 0,
  paymentDate: new Date().toISOString().slice(0, 10),
  method: "",
  reference: null,
  notes: null,
});

export function ProjectPaymentsPanel({
  project,
  isAdmin,
  onAdd,
  onDelete,
}: {
  project: Project;
  isAdmin: boolean;
  onAdd: (payload: ProjectPaymentPayload) => Promise<void>;
  onDelete: (paymentId: number) => void;
}) {
  const [form, setForm] = useState(emptyPayment);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onAdd(form);
      setForm(emptyPayment());
      setDialogOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payment could not be added.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-5 px-6 pt-6">
        <SectionHeading>Payments</SectionHeading>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="block text-xs text-on-surface-variant">Total received</span>
              <strong className="text-on-surface">{formatMoney(project.totalReceived)}</strong>
            </div>
            <div>
              <span className="block text-xs text-on-surface-variant">Outstanding</span>
              <strong className="text-on-surface">{formatMoney(project.outstandingBalance)}</strong>
            </div>
            <StatusChip value={project.paymentStatus} />
          </div>
          {isAdmin && <Button size="sm" onClick={() => { setError(""); setDialogOpen(true); }}><Icon className="text-[16px]">add</Icon>Add payment</Button>}
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        title="Add payment"
        description={`Record a payment received for ${project.name}.`}
        icon="payments"
        width="lg"
        submitLabel="Add payment"
        submittingLabel="Adding…"
        submitting={submitting}
        submitDisabled={form.amount <= 0}
        error={error}
        onSubmit={submit}
        onClose={() => { setDialogOpen(false); setError(""); setForm(emptyPayment()); }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount">
            <MoneyInput value={form.amount} onChange={(amount) => setForm((row) => ({ ...row, amount }))} required />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={form.paymentDate} onChange={(event) => setForm((row) => ({ ...row, paymentDate: event.target.value }))} required />
          </FormField>
          <FormField label="Method">
            <Input value={form.method} onChange={(event) => setForm((row) => ({ ...row, method: event.target.value }))} required />
          </FormField>
          <FormField label="Reference">
            <Input value={form.reference ?? ""} onChange={(event) => setForm((row) => ({ ...row, reference: event.target.value || null }))} />
          </FormField>
          <FormField label="Notes" className="md:col-span-2">
            <Textarea value={form.notes ?? ""} onChange={(event) => setForm((row) => ({ ...row, notes: event.target.value || null }))} />
          </FormField>
        </div>
      </FormDialog>

      {project.payments.length ? (
        <DataTable minWidth="760px">
          <thead>
            <TableHeadRow>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              {isAdmin && <th className="px-4 py-3 font-medium" />}
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {project.payments.map((payment) => (
              <TableRow key={payment.id}>
                <td className="px-6 text-sm text-on-surface">{formatDate(payment.paymentDate)}</td>
                <td className="px-4 text-sm font-medium text-on-surface">{formatMoney(payment.amount)}</td>
                <td className="px-4 text-sm text-on-surface">{payment.method}</td>
                <td className="px-4 text-sm text-on-surface">{payment.reference || "—"}</td>
                <td className="max-w-60 truncate px-4 text-sm text-on-surface">{payment.notes || "—"}</td>
                {isAdmin && (
                  <td className="px-4 text-right">
                    <IconButton aria-label="Delete payment" size="sm" onClick={() => onDelete(payment.id)}>
                      <Icon className="text-[17px]">delete</Icon>
                    </IconButton>
                  </td>
                )}
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState>No payments recorded yet.</EmptyState>
      )}
    </section>
  );
}
