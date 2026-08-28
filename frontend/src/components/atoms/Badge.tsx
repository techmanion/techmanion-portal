export function StatusChip({ value }: { value: string }) {
  const tone =
    value === "ACTIVE" ||
    value === "PAID" ||
    value === "COMPLETED" ||
    value === "FULLY_PAID" ||
    value === "RECONCILED" ||
    value === "AVAILABLE"
      ? "bg-primary/10 text-primary"
      : value === "TERMINATED" ||
          value === "CANCELLED" ||
          value === "OVERDUE" ||
          value === "UNRECONCILED" ||
          value === "RETIRED"
        ? "bg-error/10 text-error"
        : value === "PARTIALLY_PAID" ||
            value === "IN_PROGRESS" ||
            value === "IN_REPAIR" ||
            value === "IN_USE"
          ? "bg-tertiary/10 text-tertiary"
          : "bg-surface-container-highest text-on-surface-variant";
  const text = value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
