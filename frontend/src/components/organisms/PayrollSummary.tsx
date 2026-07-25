import { formatMoney } from "../../lib/format";

function SummaryMetric({
  labelText,
  value,
  tone = "default",
}: {
  labelText: string;
  value: string;
  tone?: "default" | "primary" | "tertiary";
}) {
  return (
    <div className="min-w-0 flex-1 px-5 first:pl-0">
      <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
        {labelText}
      </span>
      <strong
        className={`mt-2 block text-xl font-semibold leading-tight ${
          tone === "primary" ? "text-primary" : tone === "tertiary" ? "text-tertiary" : "text-on-surface"
        }`}
      >
        {value}
      </strong>
    </div>
  );
}

export function PayrollSummary({
  totalCount,
  gross,
  tax,
  net,
  outstanding,
  currency,
  paidCount,
  partialCount,
  pendingCount,
  paidPct,
  partialPct,
}: {
  totalCount: number;
  gross: number;
  tax: number;
  net: number;
  outstanding: number;
  currency: string;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  paidPct: number;
  partialPct: number;
}) {
  return (
    <div>
      <div className="flex divide-x divide-outline-variant/50">
        <SummaryMetric labelText="Employees" value={String(totalCount)} />
        <SummaryMetric labelText="Gross Payroll" value={formatMoney(gross, currency)} />
        <SummaryMetric labelText="Tax Deductions" value={formatMoney(tax, currency)} />
        <SummaryMetric labelText="Net Payable" value={formatMoney(net, currency)} tone="primary" />
        <SummaryMetric labelText="Outstanding" value={formatMoney(outstanding, currency)} tone="tertiary" />
      </div>
      <div className="mt-6">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-outline-variant">
          <span className="bg-primary" style={{ width: `${paidPct}%` }} />
          <span className="bg-tertiary" style={{ width: `${partialPct}%` }} />
        </div>
        <div className="mt-3 flex gap-6 text-xs text-on-surface-variant">
          <span className="flex items-center gap-2">
            <i className="size-2 rounded-full bg-primary" />
            {paidCount} Paid
          </span>
          <span className="flex items-center gap-2">
            <i className="size-2 rounded-full bg-tertiary" />
            {partialCount} Partial
          </span>
          <span className="flex items-center gap-2">
            <i className="size-2 rounded-full bg-outline-variant" />
            {pendingCount} Pending
          </span>
        </div>
      </div>
    </div>
  );
}
