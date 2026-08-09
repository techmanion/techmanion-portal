import { Link } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules/EmptyState";
import { label } from "../../lib/format";
import type { Activity } from "../../types";

function activityHref(activity: Activity): string | null {
  if (activity.action === "DELETE") return null;
  if (activity.entityType === "Candidate" || activity.entityType === "Job") return "/hiring";
  if (activity.entityType === "Employee") return `/employees/${activity.entityId}`;
  if (activity.entityType === "Project" || activity.entityType === "ProjectPayment") {
    return activity.entityType === "Project" ? `/projects/${activity.entityId}` : "/projects";
  }
  if (activity.entityType === "PayrollEntry") return "/finance?tab=payroll";
  if (activity.entityType === "Expense") return "/finance?tab=expenses";
  if (activity.entityType === "BankAccount" || activity.entityType === "BankTransaction") {
    return activity.entityType === "BankAccount"
      ? `/finance/bank-accounts/${activity.entityId}`
      : "/finance?tab=bank%20accounts";
  }
  if (activity.entityType === "BankTransfer") return "/finance?tab=bank%20accounts";
  if (activity.entityType === "Organization") return "/organization";
  return null;
}

function activityIcon(action: string): string {
  if (action === "DELETE") return "delete";
  if (action === "PAID") return "paid";
  if (action === "HIRED") return "person_add";
  if (action === "DEACTIVATE") return "block";
  if (action === "ACTIVATE") return "check_circle";
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
                    {label(activity.entityType)} · {label(activity.action)}
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
