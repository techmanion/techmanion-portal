import { cn } from "@/lib/utils";
import { EMPLOYEE_STATUS_LABELS } from "@/lib/labels";

// Status chip: tinted bg at ~10% of the status color + colored text. This is
// the only place tinted backgrounds appear (design-doc §2.4).
const STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  ON_LEAVE: "bg-warning/10 text-warning",
  RESIGNED: "bg-muted text-muted-foreground",
  TERMINATED: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {EMPLOYEE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
