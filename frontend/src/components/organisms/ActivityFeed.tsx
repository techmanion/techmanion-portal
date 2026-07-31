import { Link } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules/EmptyState";
import { label } from "../../lib/format";
import type { Activity } from "../../types";

function activityHref(activity: Activity): string | null {
  if (activity.action === "DELETE") return null;
  if (activity.entity === "Candidate" || activity.entity === "Job") return "/hiring";
  if (activity.entity === "Employee") return `/employees/${activity.entityId}`;
  if (activity.entity === "Project") return `/projects/${activity.entityId}`;
  if (activity.entity === "PayrollEntry") return "/finance?tab=payroll";
  if (activity.entity === "Expense") return "/finance?tab=expenses";
  return null;
}

function activityIcon(action: string): string {
  if (action === "DELETE") return "delete";
  if (action === "PAID") return "paid";
  if (action === "CONVERT") return "person_add";
  if (action === "CREATE") return "add";
  return "edit";
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <section className="surface-panel overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeading>Recent Activity</SectionHeading>
      </div>
      {!activities.length ? (
        <EmptyState>No recent activity yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {activities.map((activity) => {
            const href = activityHref(activity);
            const content = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-on-surface-variant">
                  <Icon className="text-[18px]">{activityIcon(activity.action)}</Icon>
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-medium text-on-surface">
                    {activity.description}
                  </strong>
                  <span className="mt-0.5 block text-xs text-on-surface-variant">
                    {label(activity.entity)} · {label(activity.action)}
                  </span>
                </span>
                <time className="shrink-0 text-xs text-on-surface-variant">
                  {new Intl.DateTimeFormat("en-PK", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(activity.timestamp))}
                </time>
              </>
            );
            return (
              <li key={activity.id}>
                {href ? (
                  <Link
                    to={href}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-surface-container-high/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 px-6 py-4">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
