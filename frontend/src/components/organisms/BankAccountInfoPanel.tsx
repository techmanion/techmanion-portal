import { SectionHeading } from "../atoms/Typography";
import { formatMoney } from "../../lib/format";
import type { BankAccount } from "../../types";

function Detail({ labelText, children }: { labelText: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
        {labelText}
      </dt>
      <dd className="text-sm text-on-surface">{children}</dd>
    </div>
  );
}

export function BankAccountInfoPanel({ account }: { account: BankAccount }) {
  return (
    <section className="surface-panel mb-6 p-6">
      <SectionHeading className="mb-6">Account Information</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
        <Detail labelText="Current balance">{formatMoney(account.balance, account.currency)}</Detail>
        <Detail labelText="Opening balance (capital, not income)">
          {formatMoney(account.openingBalance, account.currency)}
        </Detail>
        <Detail labelText="Currency">{account.currency}</Detail>
        <Detail labelText="Bank / provider">{account.bankName}</Detail>
        <Detail labelText="Account identifier">{account.accountIdentifier || "—"}</Detail>
        <Detail labelText="Status">{account.isActive ? "Active" : "Inactive"}</Detail>
        {account.notes && (
          <div className="md:col-span-3">
            <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
              Notes
            </dt>
            <dd className="text-sm leading-6 text-on-surface">{account.notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
