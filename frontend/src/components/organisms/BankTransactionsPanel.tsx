import { useState } from "react";
import { Button, Icon, Input, Select, Textarea } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import { EmptyState, FormDialog, FormField, MoneyInput } from "../molecules";
import { formatDate, formatMoney } from "../../lib/format";
import type { BankAccount, BankTransactionPayload, BankTransferPayload } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

const today = () => new Date().toISOString().slice(0, 10);

const emptyTransaction = (): BankTransactionPayload => ({
  date: today(),
  amount: 0,
  pkrEquivalent: null,
  description: "",
  notes: null,
});

function TransactionDialog({
  open,
  title,
  icon,
  account,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  icon: string;
  account: BankAccount;
  onSubmit: (payload: BankTransactionPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BankTransactionPayload>(emptyTransaction);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requiresPkrEquivalent = account.currency !== "PKR";

  function set<K extends keyof BankTransactionPayload>(key: K, value: BankTransactionPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setForm(emptyTransaction());
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
      reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Transaction could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      title={title}
      description={`Record a ${title.toLowerCase()} for ${account.name}.`}
      icon={icon}
      submitLabel="Save"
      submittingLabel="Saving…"
      submitting={submitting}
      submitDisabled={form.amount <= 0 || !form.description || (requiresPkrEquivalent && !form.pkrEquivalent)}
      error={error}
      onSubmit={submit}
      onClose={() => { onClose(); reset(); }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Amount" hint={account.currency}>
          <MoneyInput value={form.amount} onChange={(amount) => set("amount", amount)} required />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={(event) => set("date", event.target.value)} required />
        </FormField>
        {requiresPkrEquivalent && (
          <FormField label="PKR equivalent" hint="Manually entered for reconciliation" className="md:col-span-2">
            <MoneyInput value={form.pkrEquivalent ?? 0} onChange={(amount) => set("pkrEquivalent", amount)} required />
          </FormField>
        )}
        <FormField label="Description" className="md:col-span-2">
          <Input value={form.description} onChange={(event) => set("description", event.target.value)} required />
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
        </FormField>
      </div>
    </FormDialog>
  );
}

function TransferDialog({
  open,
  account,
  otherAccounts,
  onSubmit,
  onClose,
}: {
  open: boolean;
  account: BankAccount;
  otherAccounts: BankAccount[];
  onSubmit: (payload: BankTransferPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [destinationId, setDestinationId] = useState<number | "">(otherAccounts[0]?.id ?? "");
  const [sourceAmount, setSourceAmount] = useState(0);
  const [destinationAmount, setDestinationAmount] = useState(0);
  const [pkrEquivalent, setPkrEquivalent] = useState(0);
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const destination = otherAccounts.find((row) => row.id === destinationId) ?? null;
  const sameCurrency = destination ? destination.currency === account.currency : true;
  const requiresPkrEquivalent =
    destination && account.currency !== "PKR" && destination.currency !== "PKR";

  function reset() {
    setDestinationId(otherAccounts[0]?.id ?? "");
    setSourceAmount(0);
    setDestinationAmount(0);
    setPkrEquivalent(0);
    setDate(today());
    setDescription("");
    setNotes(null);
    setError("");
  }

  function setSharedAmount(amount: number) {
    setSourceAmount(amount);
    if (sameCurrency) setDestinationAmount(amount);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!destination) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        sourceAccountId: account.id,
        destinationAccountId: destination.id,
        sourceAmount,
        destinationAmount: sameCurrency ? sourceAmount : destinationAmount,
        date,
        description,
        notes,
        pkrEquivalent: requiresPkrEquivalent ? pkrEquivalent : null,
      });
      reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Transfer could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled =
    !destination ||
    sourceAmount <= 0 ||
    (!sameCurrency && destinationAmount <= 0) ||
    !description ||
    (Boolean(requiresPkrEquivalent) && pkrEquivalent <= 0);

  return (
    <FormDialog
      open={open}
      title="Transfer funds"
      description={`Move funds from ${account.name} to another company account.`}
      icon="sync_alt"
      width="lg"
      submitLabel="Transfer"
      submittingLabel="Transferring…"
      submitting={submitting}
      submitDisabled={submitDisabled}
      error={error}
      onSubmit={submit}
      onClose={() => { onClose(); reset(); }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="To account">
          <Select
            value={destinationId}
            onChange={(event) => setDestinationId(Number(event.target.value))}
            required
          >
            {otherAccounts.map((row) => (
              <option key={row.id} value={row.id}>{row.name} ({row.currency})</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </FormField>
        <FormField label={sameCurrency ? "Amount" : "Amount debited"} hint={account.currency}>
          <MoneyInput value={sourceAmount} onChange={setSharedAmount} required />
        </FormField>
        {!sameCurrency && (
          <FormField label="Amount credited" hint={destination?.currency}>
            <MoneyInput value={destinationAmount} onChange={setDestinationAmount} required />
          </FormField>
        )}
        {requiresPkrEquivalent && (
          <FormField label="PKR equivalent" hint="Value of this transfer in PKR" className="md:col-span-2">
            <MoneyInput value={pkrEquivalent} onChange={setPkrEquivalent} required />
          </FormField>
        )}
        <FormField label="Description" className="md:col-span-2">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} required />
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={notes ?? ""} onChange={(event) => setNotes(event.target.value || null)} />
        </FormField>
      </div>
    </FormDialog>
  );
}

export function BankTransactionsPanel({
  account,
  otherAccounts,
  onAddCredit,
  onAddDebit,
  onTransfer,
}: {
  account: BankAccount;
  otherAccounts: BankAccount[];
  onAddCredit: (payload: BankTransactionPayload) => Promise<void>;
  onAddDebit: (payload: BankTransactionPayload) => Promise<void>;
  onTransfer: (payload: BankTransferPayload) => Promise<void>;
}) {
  const [dialog, setDialog] = useState<"credit" | "debit" | "transfer" | null>(null);

  return (
    <section className="surface-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <h2 className="text-heading font-medium text-on-surface">Transaction history</h2>
        {account.isActive && (
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" variant="ghost" onClick={() => setDialog("debit")}><Icon className="text-[16px]">remove</Icon>Add debit</Button>
            <Button size="sm" variant="ghost" onClick={() => setDialog("credit")}><Icon className="text-[16px]">add</Icon>Add credit</Button>
            {otherAccounts.length > 0 && (
              <Button size="sm" onClick={() => setDialog("transfer")}><Icon className="text-[16px]">sync_alt</Icon>Transfer</Button>
            )}
          </div>
        )}
      </div>

      <TransactionDialog
        open={dialog === "credit"}
        title="Add credit"
        icon="add"
        account={account}
        onSubmit={async (payload) => { await onAddCredit(payload); setDialog(null); }}
        onClose={() => setDialog(null)}
      />
      <TransactionDialog
        open={dialog === "debit"}
        title="Add debit"
        icon="remove"
        account={account}
        onSubmit={async (payload) => { await onAddDebit(payload); setDialog(null); }}
        onClose={() => setDialog(null)}
      />
      <TransferDialog
        open={dialog === "transfer"}
        account={account}
        otherAccounts={otherAccounts}
        onSubmit={async (payload) => { await onTransfer(payload); setDialog(null); }}
        onClose={() => setDialog(null)}
      />

      {account.transactions.length ? (
        <DataTable minWidth="980px">
          <thead>
            <TableHeadRow>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">PKR equivalent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {account.transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <td className="px-6 text-sm text-on-surface">{formatDate(transaction.date)}</td>
                <td className="px-4">
                  <span className="block text-sm font-medium text-on-surface">{transaction.description}</span>
                  {transaction.isTransfer && transaction.counterpartyAccountName && (
                    <span className="mt-1 block text-xs text-on-surface-variant">
                      {transaction.transactionType === "DEBIT" ? "To" : "From"} {transaction.counterpartyAccountName}
                    </span>
                  )}
                </td>
                <td className="px-4 text-sm text-on-surface">
                  {transaction.isTransfer ? "Transfer" : transaction.transactionType === "CREDIT" ? "Credit" : "Debit"}
                </td>
                <td className={`px-4 text-right text-sm font-semibold ${transaction.transactionType === "CREDIT" ? "text-primary" : "text-error"}`}>
                  {transaction.transactionType === "CREDIT" ? "+" : "−"}{formatMoney(transaction.amount, account.currency)}
                </td>
                <td className="px-4 text-right text-sm text-on-surface-variant">{formatMoney(transaction.pkrEquivalent, "PKR")}</td>
                <td className="px-4">
                  <StatusChip value={transaction.isReconciled ? "RECONCILED" : "UNRECONCILED"} />
                </td>
                <td className="max-w-56 truncate px-4 text-sm text-on-surface">{transaction.notes || "—"}</td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState>No transactions recorded yet.</EmptyState>
      )}
    </section>
  );
}
