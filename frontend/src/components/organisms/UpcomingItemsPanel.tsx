import { Link } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState } from "../molecules/EmptyState";
import { formatDate } from "../../lib/format";
import type { HomeItem } from "../../types";

const itemIcons: Record<HomeItem["kind"], string> = {
  INTERVIEW: "event",
  JOINING: "person_add",
  PROJECT_DEADLINE: "event_busy",
  PAYROLL: "payments",
};

export function UpcomingItemsPanel({
  title,
  accent = "primary",
  items,
  empty,
}: {
  title: string;
  accent?: "primary" | "tertiary";
  items: HomeItem[];
  empty: string;
}) {
  return (
    <section className="surface-panel overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeading accent={accent}>{title}</SectionHeading>
      </div>
      {!items.length ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
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
      )}
    </section>
  );
}
