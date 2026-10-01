import { Icon, IconButton } from "../atoms";
import { formatDate, formatMoney } from "../../lib/format";
import type { MiscIncome } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function MiscIncomeTable({
  miscIncome,
  onEdit,
  onCopy,
  onDelete,
}: {
  miscIncome: MiscIncome[];
  onEdit: (row: MiscIncome) => void;
  onCopy: (row: MiscIncome) => void;
  onDelete: (row: MiscIncome) => void;
}) {
  return (
    <DataTable minWidth="760px">
      <thead><TableHeadRow><th className="px-6 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Title</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 font-medium">Actions</th></TableHeadRow></thead>
      <tbody className="divide-y divide-outline-variant/30">
        {miscIncome.map((row) => (
          <TableRow key={row.id}>
            <td className="px-6 text-sm text-on-surface">{formatDate(row.date)}</td>
            <td className="px-4"><strong className="block text-sm font-medium text-on-surface">{row.title}</strong>{row.notes && <span className="mt-1 block max-w-56 truncate text-xs text-on-surface-variant">{row.notes}</span>}</td>
            <td className="px-4 text-right text-sm font-semibold text-primary">{formatMoney(row.amount, row.currency)}</td>
            <td className="px-4"><div className="flex items-center gap-1"><IconButton size="sm" aria-label={`Edit ${row.title}`} onClick={() => onEdit(row)}><Icon className="text-[18px]">edit</Icon></IconButton><IconButton size="sm" aria-label={`Make a copy of ${row.title}`} onClick={() => onCopy(row)}><Icon className="text-[18px]">content_copy</Icon></IconButton><IconButton size="sm" aria-label={`Delete ${row.title}`} onClick={() => onDelete(row)}><Icon className="text-[18px]">delete</Icon></IconButton></div></td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
