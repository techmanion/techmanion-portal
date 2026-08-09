import { StatusChip } from "../atoms/Badge";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules";
import { formatDate, formatMoney } from "../../lib/format";
import type { Currency, ProjectMilestone } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function ProjectMilestonesPanel({
  milestones,
  currency,
}: {
  milestones: ProjectMilestone[];
  currency: Currency;
}) {
  return (
    <section className="surface-panel mb-8 overflow-hidden">
      <div className="px-6 pt-6">
        <SectionHeading className="mb-6">Milestones</SectionHeading>
      </div>
      {milestones.length ? (
        <DataTable minWidth="700px">
          <thead>
            <TableHeadRow>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Paid date</th>
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {milestones.map((milestone) => (
              <TableRow key={milestone.id}>
                <td className="px-6 text-sm font-medium text-on-surface">{milestone.name}</td>
                <td className="px-4 text-sm text-on-surface">{formatMoney(milestone.amount, currency)}</td>
                <td className="px-4 text-sm text-on-surface">{formatDate(milestone.dueDate)}</td>
                <td className="px-4"><StatusChip value={milestone.status} /></td>
                <td className="px-4 text-sm text-on-surface">
                  {formatDate(milestone.paidDate ?? undefined)}
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState>No milestones added.</EmptyState>
      )}
    </section>
  );
}
