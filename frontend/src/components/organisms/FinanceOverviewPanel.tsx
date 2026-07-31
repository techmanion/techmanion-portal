import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules";
import { formatDate, formatMoney, label } from "../../lib/format";
import type { FinanceOverview } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

function Metric({ labelText, value, tone = "default" }: { labelText: string; value: string; tone?: "default" | "primary" | "error" }) {
  return (
    <div className="min-w-0 sm:flex-1 sm:px-5 sm:first:pl-0">
      <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">{labelText}</span>
      <strong className={`mt-2 block truncate text-xl font-semibold ${tone === "primary" ? "text-primary" : tone === "error" ? "text-error" : "text-on-surface"}`}>{value}</strong>
    </div>
  );
}

export function FinanceOverviewPanel({ overview }: { overview: FinanceOverview }) {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:divide-x sm:divide-outline-variant/50">
          <Metric labelText="Total Income" value={formatMoney(overview.totalIncome)} tone="primary" />
          <Metric labelText="Total Expenses" value={formatMoney(overview.totalExpenses)} tone="error" />
          <Metric labelText="Payroll Total" value={formatMoney(overview.payrollTotal)} />
          <Metric labelText="Net Cash Flow" value={formatMoney(overview.netCashFlow)} tone={overview.netCashFlow >= 0 ? "primary" : "error"} />
        </div>
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="px-6 pt-6"><SectionHeading className="mb-6">Recent Transactions</SectionHeading></div>
        {overview.recentTransactions.length ? (
          <DataTable minWidth="760px">
            <thead><TableHeadRow><th className="px-6 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Transaction</th><th className="px-4 py-3 font-medium">Details</th><th className="px-4 py-3 text-right font-medium">Amount</th></TableHeadRow></thead>
            <tbody className="divide-y divide-outline-variant/30">
              {overview.recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <td className="px-6 text-sm text-on-surface">{formatDate(transaction.date)}</td>
                  <td className="px-4 text-sm text-on-surface">{label(transaction.kind)}</td>
                  <td className="px-4 text-sm font-medium text-on-surface">{transaction.title}</td>
                  <td className="px-4 text-sm text-on-surface-variant">{transaction.description}</td>
                  <td className={`px-4 text-right text-sm font-semibold ${transaction.kind === "INCOME" ? "text-primary" : "text-error"}`}>
                    {transaction.kind === "INCOME" ? "+" : "−"}{formatMoney(transaction.amount, transaction.currency)}
                  </td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        ) : <EmptyState>No transactions yet.</EmptyState>}
      </section>
    </div>
  );
}
