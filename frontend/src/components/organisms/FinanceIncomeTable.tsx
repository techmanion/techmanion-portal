import { Link } from "react-router-dom";
import { formatDate, formatMoney } from "../../lib/format";
import type { FinanceIncome } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function FinanceIncomeTable({ income }: { income: FinanceIncome[] }) {
  return (
    <DataTable minWidth="980px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Date</th>
          <th className="px-4 py-3 font-medium">Project</th>
          <th className="px-4 py-3 font-medium">Client</th>
          <th className="px-4 py-3 text-right font-medium">Amount</th>
          <th className="px-4 py-3 font-medium">Payment Method</th>
          <th className="px-4 py-3 font-medium">Reference</th>
          <th className="px-4 py-3 font-medium">Notes</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {income.map((payment) => (
          <TableRow key={payment.id}>
            <td className="px-6 text-sm text-on-surface">{formatDate(payment.date)}</td>
            <td className="px-4 text-sm font-medium">
              <Link to={`/projects/${payment.projectId}`} className="text-on-surface hover:text-primary">
                {payment.projectName}
              </Link>
            </td>
            <td className="px-4 text-sm text-on-surface">{payment.clientName}</td>
            <td className="px-4 text-right text-sm font-semibold text-primary">
              {formatMoney(payment.amount, payment.currency)}
            </td>
            <td className="px-4 text-sm text-on-surface">{payment.paymentMethod}</td>
            <td className="px-4 text-sm text-on-surface">{payment.reference || "—"}</td>
            <td className="max-w-64 truncate px-4 text-sm text-on-surface">{payment.notes || "—"}</td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
