export function formatMoney(amount: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

/** Total per currency, since amounts in different currencies can't be added together. */
export function formatCurrencyTotals(rows: { amount: number; currency: string }[]): string {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amount);
  if (!totals.size) return formatMoney(0);
  return [...totals.entries()]
    .sort(([a], [b]) => (a === "PKR" ? -1 : b === "PKR" ? 1 : a.localeCompare(b)))
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" · ");
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );
}

/** The current month as YYYY-MM in the viewer's local time. */
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function label(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const employeeTypeLabels: Record<string, string> = {
  EXECUTIVE: "Core Member",
  EMPLOYEE: "Employee",
  CONTRACTOR: "Contractor",
  INTERN: "Intern",
};

export function employeeTypeLabel(value: string): string {
  return employeeTypeLabels[value] ?? label(value);
}

const documentKindLabels: Record<string, string> = {
  NDA: "NDA",
};

export function documentKindLabel(value: string): string {
  return documentKindLabels[value] ?? label(value);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

