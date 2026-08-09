import { Icon } from "../atoms";
import { EmptyState } from "../molecules";
import { label } from "../../lib/format";
import type { Activity } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

function actionTone(action: string): string {
  if (action === "DELETE" || action === "DEACTIVATE") return "bg-error/10 text-error";
  if (action === "CREATE" || action === "PAID" || action === "ACTIVATE" || action === "HIRED") {
    return "bg-primary/10 text-primary";
  }
  return "bg-surface-container-highest text-on-surface-variant";
}

export function ActivityTable({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <EmptyState>No activity matches the selected filters.</EmptyState>;
  }

  return (
    <DataTable minWidth="960px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">When</th>
          <th className="px-4 py-3 font-medium">Description</th>
          <th className="px-4 py-3 font-medium">Module</th>
          <th className="px-4 py-3 font-medium">Action</th>
          <th className="px-4 py-3 font-medium">By</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {activities.map((activity) => (
          <TableRow key={activity.id}>
            <td className="px-6 text-sm text-on-surface-variant">
              {new Intl.DateTimeFormat("en-PK", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(activity.timestamp))}
            </td>
            <td className="px-4 text-sm text-on-surface">{activity.description}</td>
            <td className="px-4 text-sm text-on-surface-variant">{label(activity.entityType)}</td>
            <td className="px-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${actionTone(activity.action)}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {label(activity.action)}
              </span>
            </td>
            <td className="px-4 text-sm text-on-surface-variant">
              {activity.performedByName ? (
                activity.performedByName
              ) : (
                <span className="inline-flex items-center gap-1.5 text-on-surface-variant/70">
                  <Icon className="text-[16px]">smart_toy</Icon>
                  System
                </span>
              )}
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
