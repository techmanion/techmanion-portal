import { useState } from "react";
import { Button, Input, Select, Textarea } from "../atoms";
import { FormField, MoneyInput } from "../molecules";
import { PROJECT_CURRENCIES } from "../../lib/options";
import type { BankAccount, BankAccountPayload, Currency } from "../../types";

const emptyAccount = (): BankAccountPayload => ({
  name: "",
  bankName: "",
  currency: "PKR",
  openingBalance: 0,
  openingBalancePkr: 0,
  isActive: true,
  accountIdentifier: null,
  notes: null,
});

export function BankAccountFormPanel({
  account,
  onSubmit,
  onCancel,
}: {
  account: BankAccount | null;
  onSubmit: (payload: BankAccountPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BankAccountPayload>(() =>
    account
      ? {
          name: account.name,
          bankName: account.bankName,
          currency: account.currency,
          openingBalance: account.openingBalance,
          openingBalancePkr: account.openingBalancePkr,
          isActive: account.isActive,
          accountIdentifier: account.accountIdentifier,
          notes: account.notes,
        }
      : emptyAccount(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currencyLocked = Boolean(account && account.transactions.length > 0);

  function set<K extends keyof BankAccountPayload>(key: K, value: BankAccountPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setCurrency(currency: Currency) {
    setForm((current) => ({
      ...current,
      currency,
      openingBalancePkr: currency === "PKR" ? current.openingBalance : current.openingBalancePkr,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bank account could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-panel p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Account name">
          <Input value={form.name} onChange={(event) => set("name", event.target.value)} required />
        </FormField>
        <FormField label="Bank / provider">
          <Input value={form.bankName} onChange={(event) => set("bankName", event.target.value)} required />
        </FormField>
        <FormField label="Currency" hint={currencyLocked ? "Locked once transactions exist" : undefined}>
          <Select
            value={form.currency}
            disabled={currencyLocked}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {PROJECT_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Opening balance" hint={`${form.currency} · treated as initial capital, not income`}>
          <MoneyInput value={form.openingBalance} onChange={(amount) => set("openingBalance", amount)} required />
        </FormField>
        {form.currency !== "PKR" && (
          <FormField label="Opening balance (PKR equivalent)">
            <MoneyInput
              value={form.openingBalancePkr ?? 0}
              onChange={(amount) => set("openingBalancePkr", amount)}
              required
            />
          </FormField>
        )}
        <FormField label="Account identifier" hint="IBAN, account number, etc. (optional)">
          <Input
            value={form.accountIdentifier ?? ""}
            onChange={(event) => set("accountIdentifier", event.target.value || null)}
          />
        </FormField>
        <FormField label="Status">
          <Select
            value={form.isActive ? "ACTIVE" : "INACTIVE"}
            onChange={(event) => set("isActive", event.target.value === "ACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
        </FormField>
      </div>
      {error && <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <div className="mt-6 flex items-center gap-3 border-t border-outline-variant/30 pt-6">
        <Button type="submit" disabled={submitting || !form.name || !form.bankName}>
          {submitting ? "Saving…" : account ? "Save changes" : "Add account"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
