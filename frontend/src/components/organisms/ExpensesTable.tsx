import { Icon, IconButton } from "../atoms";
import { formatDate, formatMoney, label } from "../../lib/format";
import type { Expense } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function ExpensesTable({
  expenses,
  onEdit,
  onCopy,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onCopy: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <DataTable minWidth="960px">
      <thead><TableHeadRow><th className="px-6 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Title</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Frequency</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 font-medium">Actions</th></TableHeadRow></thead>
      <tbody className="divide-y divide-outline-variant/30">
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <td className="px-6 text-sm text-on-surface">{formatDate(expense.date)}</td>
            <td className="px-4"><strong className="block text-sm font-medium text-on-surface">{expense.title}</strong>{expense.notes && <span className="mt-1 block max-w-56 truncate text-xs text-on-surface-variant">{expense.notes}</span>}</td>
            <td className="px-4 text-sm text-on-surface">{expense.category}</td>
            <td className="px-4 text-sm text-on-surface">{label(expense.expenseType)}</td>
            <td className="px-4 text-sm text-on-surface">{expense.frequency ? label(expense.frequency) : "—"}</td>
            <td className="px-4 text-right text-sm font-semibold text-on-surface">{formatMoney(expense.amount, expense.currency)}</td>
            <td className="px-4"><div className="flex items-center gap-1"><IconButton size="sm" aria-label={`Edit ${expense.title}`} onClick={() => onEdit(expense)}><Icon className="text-[18px]">edit</Icon></IconButton><IconButton size="sm" aria-label={`Make a copy of ${expense.title}`} onClick={() => onCopy(expense)}><Icon className="text-[18px]">content_copy</Icon></IconButton><IconButton size="sm" aria-label={`Delete ${expense.title}`} onClick={() => onDelete(expense)}><Icon className="text-[18px]">delete</Icon></IconButton></div></td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
