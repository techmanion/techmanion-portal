import { useState } from "react";
import { Button, Input, Select, Textarea } from "../atoms";
import { FormField, MoneyInput } from "../molecules";
import { label } from "../../lib/format";
import { EXPENSE_TYPES } from "../../lib/options";
import type { Expense, ExpensePayload, ExpenseType } from "../../types";

const emptyExpense = (): ExpensePayload => ({
  title: "",
  category: "",
  amount: 0,
  currency: "PKR",
  expenseType: "ONE_TIME",
  frequency: null,
  date: new Date().toISOString().slice(0, 10),
  notes: null,
});

export function ExpenseFormPanel({
  expense,
  onSubmit,
  onCancel,
}: {
  expense: Expense | null;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ExpensePayload>(() =>
    expense
      ? {
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          currency: expense.currency,
          expenseType: expense.expenseType,
          frequency: expense.frequency,
          date: expense.date,
          notes: expense.notes,
        }
      : emptyExpense(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ExpensePayload>(key: K, value: ExpensePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Title">
          <Input value={form.title} onChange={(event) => set("title", event.target.value)} required />
        </FormField>
        <FormField label="Category">
          <Input value={form.category} onChange={(event) => set("category", event.target.value)} required />
        </FormField>
        <FormField label="Amount">
          <MoneyInput value={form.amount} onChange={(amount) => set("amount", amount)} required />
        </FormField>
        <FormField label="Currency">
          <Input value={form.currency} maxLength={3} onChange={(event) => set("currency", event.target.value.toUpperCase())} required />
        </FormField>
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
        <Button type="submit" disabled={submitting || form.amount <= 0}>
          {submitting ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
