import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/Badge";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules";
import { label } from "../../lib/format";
import { INVENTORY_CATEGORY_ICONS } from "../../lib/options";
import type { InventoryCategory, InventoryOverview } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

function Metric({
  labelText,
  value,
  tone = "default",
}: {
  labelText: string;
  value: number;
  tone?: "default" | "primary" | "error" | "tertiary";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "error"
        ? "text-error"
        : tone === "tertiary"
          ? "text-tertiary"
          : "text-on-surface";
  return (
    <div className="min-w-0 sm:flex-1 sm:px-5 sm:first:pl-0">
      <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
        {labelText}
      </span>
      <strong className={`mt-2 block truncate text-xl font-semibold ${toneClass}`}>{value}</strong>
    </div>
  );
}

export function InventoryShelfPanel({
  overview,
  onCategoryClick,
  onAttentionClick,
}: {
  overview: InventoryOverview;
  onCategoryClick: (category: InventoryCategory) => void;
  onAttentionClick: (itemId: number) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:divide-x sm:divide-outline-variant/50">
          <Metric labelText="Available" value={overview.available} tone="primary" />
          <Metric labelText="In use" value={overview.inUse} tone="tertiary" />
          <Metric labelText="In repair" value={overview.inRepair} tone="error" />
          <Metric labelText="Retired" value={overview.retired} />
        </div>
      </section>

      <section className="surface-panel p-6">
        <SectionHeading className="mb-5">Category shelf</SectionHeading>
        {overview.categories.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {overview.categories.map((shelf) => (
              <button
                key={shelf.category}
                type="button"
                onClick={() => onCategoryClick(shelf.category)}
                className="flex items-center gap-4 rounded-[22px] bg-surface-container-high/40 px-4 py-4 text-left transition hover:bg-surface-container-high"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-container-highest text-on-surface">
                  <Icon className="text-[24px]">{INVENTORY_CATEGORY_ICONS[shelf.category]}</Icon>
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-semibold text-on-surface">
                    {label(shelf.category)}
                  </strong>
                  <span className="mt-1 block text-xs text-on-surface-variant">
                    {shelf.available} available · {shelf.total} total
                  </span>
                </span>
                <Icon className="text-[18px] text-on-surface-variant">chevron_right</Icon>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState>No stock on the shelves yet. Receive your first items to get started.</EmptyState>
        )}
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="px-6 pt-6">
          <SectionHeading className="mb-6">Needs attention</SectionHeading>
        </div>
        {overview.attention.length ? (
          <DataTable minWidth="720px">
            <thead>
              <TableHeadRow>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
              </TableHeadRow>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {overview.attention.map((row) => (
                <TableRow key={`${row.id}-${row.reason}`} onClick={() => onAttentionClick(row.id)}>
                  <td className="px-6">
                    <strong className="block text-sm font-medium text-on-surface">{row.name}</strong>
                    <span className="font-mono text-[11px] text-on-surface-variant">{row.assetTag}</span>
                  </td>
                  <td className="px-4 text-sm text-on-surface">{row.reason}</td>
                  <td className="px-4">
                    <StatusChip value={row.status} />
                  </td>
                  <td className="px-4 text-sm text-on-surface-variant">{row.location || "—"}</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState>Everything looks tidy — nothing needs attention.</EmptyState>
        )}
      </section>
    </div>
  );
}
