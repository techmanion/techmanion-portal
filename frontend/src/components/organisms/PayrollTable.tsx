import { Icon, IconButton } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatMoney } from "../../lib/format";
import type { PayrollEntry } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function PayrollTable({
  entries,
  onMarkPaid,
  onBackfillBank,
  onPrintSlip,
  onEdit,
  onDelete,
}: {
  entries: PayrollEntry[];
  onMarkPaid: (entry: PayrollEntry) => void;
  onBackfillBank: (entry: PayrollEntry) => void;
  onPrintSlip: (entry: PayrollEntry) => void;
  onEdit: (entry: PayrollEntry) => void;
  onDelete: (entry: PayrollEntry) => void;
}) {
  return (
    <DataTable minWidth="1140px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Employee</th>
          <th className="px-3 py-3 text-right font-medium">Base Compensation</th>
          <th className="px-3 py-3 text-right font-medium">Bonus &amp; Holiday</th>
          <th className="px-3 py-3 text-right font-medium">Commission</th>
          <th className="px-3 py-3 text-right font-medium">Adjustment</th>
          <th className="px-3 py-3 text-right font-medium">Final Amount</th>
          <th className="px-3 py-3 font-medium">Status</th>
          <th className="px-3 py-3 font-medium">Actions</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <td className="px-6">
              <EmployeeCell name={entry.employeeName} subtitle={`Employee #${entry.employeeId}`} />
            </td>
            <td className="px-3 text-right text-sm">
              {formatMoney(entry.baseCompensation, entry.currency)}
            </td>
            <td className="px-3 text-right text-sm">
              {formatMoney(entry.bonus + entry.holidayCompensation, entry.currency)}
            </td>
            <td className="px-3 text-right text-sm">
              {formatMoney(entry.commissionAmount, entry.currency)}
            </td>
            <td
              className={`px-3 text-right text-sm ${entry.adjustment < 0 ? "text-error" : "text-on-surface"}`}
            >
              {formatMoney(entry.adjustment, entry.currency)}
            </td>
            <td className="px-3 text-right text-sm font-semibold">
              {formatMoney(entry.finalAmount, entry.currency)}
              {entry.pkrEquivalent != null && entry.currency !== "PKR" && (
                <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                  ≈ {formatMoney(entry.pkrEquivalent, "PKR")}
                </span>
              )}
            </td>
            <td className="px-3">
              <StatusChip value={entry.status} />
            </td>
            <td className="px-3">
              <div className="flex items-center gap-0.5">
                {entry.status !== "PAID" && (
                  <button
                    className="rounded-full px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10"
                    onClick={() => onMarkPaid(entry)}
                  >
                    Mark paid
                  </button>
                )}
                {entry.status === "PAID" && !entry.bankTransactionId && (
                  <button
                    className="rounded-full px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10"
                    onClick={() => onBackfillBank(entry)}
                  >
                    Link bank account
                  </button>
                )}
                <IconButton
                  size="sm"
                  aria-label={`Print salary slip for ${entry.employeeName}`}
                  title="Print salary slip"
                  onClick={() => onPrintSlip(entry)}
                >
                  <Icon className="text-[18px]">print</Icon>
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`Edit ${entry.employeeName}`}
                  onClick={() => onEdit(entry)}
                >
                  <Icon className="text-[18px]">edit</Icon>
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`Delete ${entry.employeeName}`}
                  onClick={() => onDelete(entry)}
                >
                  <Icon className="text-[18px]">delete</Icon>
                </IconButton>
              </div>
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
