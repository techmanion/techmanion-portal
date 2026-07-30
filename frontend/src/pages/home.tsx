import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { Icon, Loading } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState } from "../components/molecules";
import { PageHeader } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate, label } from "../lib/format";
import type { Activity, HomeData, HomeItem } from "../types";

const itemIcons: Record<HomeItem["kind"], string> = {
  INTERVIEW: "event",
  JOINING: "person_add",
  PROJECT_DEADLINE: "event_busy",
  PAYROLL: "payments",
};

function QuickAction({ icon, labelText, to }: { icon: string; labelText: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3.5 text-left text-sm font-medium text-on-surface transition hover:bg-surface-bright"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="text-[20px]">{icon}</Icon>
      </span>
      {labelText}
    </Link>
  );
}

function HomeSection({
  title,
  accent = "primary",
  children,
}: {
  title: string;
  accent?: "primary" | "tertiary";
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeading accent={accent}>{title}</SectionHeading>
      </div>
      {children}
    </section>
  );
}

function ItemList({ items, empty }: { items: HomeItem[]; empty: string }) {
  if (!items.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-outline-variant/30">
      {items.map((item, index) => (
        <li key={`${item.kind}-${item.href}-${item.eventDate ?? index}`}>
          <Link
            to={item.href}
            className="flex items-center gap-4 px-6 py-4 transition hover:bg-surface-container-high/40"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-primary">
              <Icon className="text-[18px]">{itemIcons[item.kind]}</Icon>
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-medium text-on-surface">
                {item.title}
              </strong>
              <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                {item.description}
              </span>
            </span>
            {item.eventDate && (
              <time className="shrink-0 text-xs text-on-surface-variant">
                {formatDate(item.eventDate)}
              </time>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function activityHref(activity: Activity): string | null {
  if (activity.action === "DELETE") return null;
  if (activity.entity === "Candidate" || activity.entity === "Job") return "/hiring";
  if (activity.entity === "Employee") return `/employees/${activity.entityId}`;
  if (activity.entity === "Project") return `/projects/${activity.entityId}`;
  if (activity.entity === "PayrollEntry") return "/payroll";
  return null;
}

function ActivityList({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <EmptyState>No recent activity yet.</EmptyState>;
  return (
    <ul className="divide-y divide-outline-variant/30">
      {activities.map((activity) => {
        const href = activityHref(activity);
        const content = (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-on-surface-variant">
              <Icon className="text-[18px]">
                {activity.action === "DELETE"
                  ? "delete"
                  : activity.action === "PAID"
                    ? "paid"
                    : activity.action === "CONVERT"
                      ? "person_add"
                      : activity.action === "CREATE"
                        ? "add"
                        : "edit"}
              </Icon>
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
  );
}

export function HomePage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<HomeData>("/home")
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title={`Hi, ${firstName}`}
        description="Here's what's happening across your organization."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction icon="person_add" labelText="Add Candidate" to="/hiring?action=add-candidate" />
        <QuickAction icon="group_add" labelText="Add Employee" to="/employees/new" />
        <QuickAction icon="add_task" labelText="Add Project" to="/projects?action=add-project" />
        <QuickAction icon="payments" labelText="Open Payroll" to="/payroll" />
      </div>

      {error && <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      {!data && !error ? (
        <div className="grid min-h-64 place-items-center">
          <Loading />
        </div>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <HomeSection title="Needs Attention" accent="tertiary">
            <ItemList
              items={data.needsAttention}
              empty="Nothing needs your attention right now."
            />
          </HomeSection>

          <HomeSection title="Upcoming">
            <ItemList items={data.upcoming} empty="No upcoming events." />
          </HomeSection>

          <div className="lg:col-span-2">
            <HomeSection title="Recent Activity">
              <ActivityList activities={data.recentActivity} />
            </HomeSection>
          </div>
        </div>
      ) : null}
    </div>
  );
}
