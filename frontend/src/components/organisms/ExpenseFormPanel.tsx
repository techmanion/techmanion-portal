import { useMemo, useState } from "react";
import { Button, Input, Select, Textarea } from "../atoms";
import { Icon } from "../atoms/Icon";
import { FormField, MoneyInput } from "../molecules";
import { label } from "../../lib/format";
import { EXPENSE_TYPES } from "../../lib/options";
import type { BankAccount, Expense, ExpensePayload, ExpenseType } from "../../types";

const emptyExpense = (defaultBankAccountId: number | null): ExpensePayload => ({
  title: "",
  category: "",
  amount: 0,
  currency: "PKR",
  expenseType: "ONE_TIME",
  frequency: null,
  date: new Date().toISOString().slice(0, 10),
  notes: null,
  bankAccountId: defaultBankAccountId ?? 0,
  pkrEquivalent: null,
});

/** All values from the source expense, minus its id, timestamps, and linked bank transaction. */
const expenseToPayload = (source: Expense, defaultBankAccountId: number | null): ExpensePayload => ({
  title: source.title,
  category: source.category,
  amount: source.amount,
  currency: source.currency,
  expenseType: source.expenseType,
  frequency: source.frequency,
  date: source.date,
  notes: source.notes,
  bankAccountId: source.bankAccountId ?? defaultBankAccountId ?? 0,
  pkrEquivalent: null,
});

export function ExpenseFormPanel({
  expense,
  copyFrom,
  bankAccounts,
  onSubmit,
  onCancel,
}: {
  expense: Expense | null;
  copyFrom?: Expense | null;
  bankAccounts: BankAccount[];
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ExpensePayload>(() => {
    if (expense) {
      return {
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        expenseType: expense.expenseType,
        frequency: expense.frequency,
        date: expense.date,
        notes: expense.notes,
        bankAccountId: expense.bankAccountId ?? bankAccounts[0]?.id ?? 0,
        pkrEquivalent: null,
      };
    }
    if (copyFrom) return expenseToPayload(copyFrom, bankAccounts[0]?.id ?? null);
    return emptyExpense(bankAccounts[0]?.id ?? null);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedAccount = useMemo(
    () => bankAccounts.find((account) => account.id === form.bankAccountId) ?? null,
    [bankAccounts, form.bankAccountId],
  );

  function set<K extends keyof ExpensePayload>(key: K, value: ExpensePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setBankAccount(bankAccountId: number) {
    const account = bankAccounts.find((row) => row.id === bankAccountId);
    setForm((current) => ({
      ...current,
      bankAccountId,
      currency: account?.currency ?? current.currency,
      pkrEquivalent: null,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        frequency: form.expenseType === "MONTHLY_RECURRING" ? "MONTHLY" : null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Expense could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-panel p-6">
      {copyFrom && !expense && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <Icon className="mt-0.5 text-[18px]">content_copy</Icon>
          <span>
            You're creating a copy of <strong>"{copyFrom.title}"</strong>. Review and adjust the
            details below — no IDs, timestamps, or bank transactions are carried over.
          </span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Title">
          <Input value={form.title} onChange={(event) => set("title", event.target.value)} required />
        </FormField>
        <FormField label="Category">
          <Input value={form.category} onChange={(event) => set("category", event.target.value)} required />
        </FormField>
        <FormField label="Amount" hint={form.currency}>
          <MoneyInput value={form.amount} onChange={(amount) => set("amount", amount)} required />
        </FormField>
        <FormField label="Bank account">
          <Select
            value={form.bankAccountId || ""}
            onChange={(event) => setBankAccount(Number(event.target.value))}
            required
          >
            <option value="" disabled hidden>Select bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </Select>
        </FormField>
        {selectedAccount && selectedAccount.currency !== "PKR" && (
          <FormField label="PKR equivalent">
            <MoneyInput
              value={form.pkrEquivalent ?? 0}
              onChange={(amount) => set("pkrEquivalent", amount)}
              required
            />
          </FormField>
        )}
        <FormField label="Type">
          <Select value={form.expenseType} onChange={(event) => set("expenseType", event.target.value as ExpenseType)}>
            {EXPENSE_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
          </Select>
        </FormField>
        {form.expenseType === "MONTHLY_RECURRING" && (
          <FormField label="Frequency">
            <Select value="MONTHLY" disabled><option value="MONTHLY">Monthly</option></Select>
          </FormField>
        )}
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={(event) => set("date", event.target.value)} required />
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
        </FormField>
      </div>
      {error && <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <div className="mt-6 flex items-center gap-3 border-t border-outline-variant/30 pt-6">
        <Button type="submit" disabled={submitting || form.amount <= 0 || !form.bankAccountId}>
          {submitting ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
