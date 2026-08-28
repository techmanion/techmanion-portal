import { StatusChip } from "../atoms/Badge";
import { Icon } from "../atoms/Icon";
import { label } from "../../lib/format";
import { INVENTORY_CATEGORY_ICONS } from "../../lib/options";
import type { InventoryItem } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function InventoryTable({
  items,
  onRowClick,
}: {
  items: InventoryItem[];
  onRowClick: (item: InventoryItem) => void;
}) {
  return (
    <DataTable minWidth="880px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Item</th>
          <th className="px-4 py-3 font-medium">Asset tag</th>
          <th className="px-4 py-3 font-medium">Category</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Condition</th>
          <th className="px-4 py-3 font-medium">Location</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {items.map((item) => (
          <TableRow key={item.id} onClick={() => onRowClick(item)}>
            <td className="px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-on-surface-variant">
                  <Icon className="text-[18px]">{INVENTORY_CATEGORY_ICONS[item.category]}</Icon>
                </span>
                <strong className="block text-sm font-medium text-on-surface">{item.name}</strong>
              </div>
            </td>
            <td className="px-4 font-mono text-xs text-on-surface-variant">{item.assetTag}</td>
            <td className="px-4 text-sm text-on-surface">{label(item.category)}</td>
            <td className="px-4">
              <StatusChip value={item.status} />
            </td>
            <td className="px-4 text-sm text-on-surface">{label(item.condition)}</td>
            <td className="px-4 text-sm text-on-surface-variant">{item.location || "—"}</td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
