import { StatusChip } from "../atoms/Badge";
import { IconButton, Icon } from "../atoms";
import { formatMoney } from "../../lib/format";
import type { BankAccount } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function BankAccountsTable({
  accounts,
  onSelect,
  onEdit,
}: {
  accounts: BankAccount[];
  onSelect: (account: BankAccount) => void;
  onEdit: (account: BankAccount) => void;
}) {
  return (
    <DataTable minWidth="820px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Account</th>
          <th className="px-4 py-3 font-medium">Bank</th>
          <th className="px-4 py-3 font-medium">Currency</th>
          <th className="px-4 py-3 text-right font-medium">Balance</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Actions</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {accounts.map((account) => (
          <TableRow key={account.id} onClick={() => onSelect(account)}>
            <td className="px-6"><strong className="block text-sm font-medium text-on-surface">{account.name}</strong>{account.accountIdentifier && <span className="mt-1 block text-xs text-on-surface-variant">{account.accountIdentifier}</span>}</td>
            <td className="px-4 text-sm text-on-surface">{account.bankName}</td>
            <td className="px-4 text-sm text-on-surface">{account.currency}</td>
            <td className="px-4 text-right text-sm font-semibold text-on-surface">{formatMoney(account.balance, account.currency)}</td>
            <td className="px-4"><StatusChip value={account.isActive ? "ACTIVE" : "INACTIVE"} /></td>
            <td className="px-4">
              <IconButton
                size="sm"
                aria-label={`Edit ${account.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(account);
                }}
              >
                <Icon className="text-[18px]">edit</Icon>
              </IconButton>
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
