import { StatusChip } from "../atoms/Badge";
import { Icon } from "../atoms/Icon";
import { INVENTORY_CATEGORY_ICONS } from "../../lib/options";
import type { InventoryItem } from "../../types";

export function InventoryItemGrid({
  items,
  onItemClick,
}: {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
}) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="flex flex-col gap-3 rounded-[22px] bg-surface-container-high/40 p-4 text-left transition hover:bg-surface-container-high"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-surface-container-highest text-on-surface">
              <Icon className="text-[22px]">{INVENTORY_CATEGORY_ICONS[item.category]}</Icon>
            </span>
            <StatusChip value={item.status} />
          </div>
          <div>
            <strong className="block text-sm font-semibold text-on-surface">{item.name}</strong>
            <span className="mt-1 block font-mono text-[11px] tracking-wide text-on-surface-variant">
              {item.assetTag}
            </span>
          </div>
          <p className="truncate text-xs text-on-surface-variant">
            {item.location || "No location labeled"}
          </p>
        </button>
      ))}
    </div>
  );
}
