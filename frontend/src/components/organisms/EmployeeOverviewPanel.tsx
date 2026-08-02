import type { ReactNode } from "react";
import { SectionHeading } from "../atoms/Typography";
import { employeeTypeLabel, formatDate, label } from "../../lib/format";
import type { Employee } from "../../types";

function Definition({ labelText, children }: { labelText: string; children: ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
        {labelText}
      </dt>
      <dd className="m-0 text-sm leading-6 text-on-surface">{children}</dd>
    </div>
  );
}

export function EmployeeOverviewPanel({ employee }: { employee: Employee }) {
  const history = [...employee.identifierHistory].reverse();
  return (
    <section className="surface-panel mt-8 max-w-5xl p-6">
      <SectionHeading className="mb-6">Employee Information</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        <Definition labelText="Full name">{employee.fullName}</Definition>
        <Definition labelText="Email">{employee.email}</Definition>
        <Definition labelText="Phone">{employee.phone}</Definition>
        <Definition labelText="Designation">{employee.designation?.name ?? "—"}</Definition>
        <Definition labelText="Employment type">{employeeTypeLabel(employee.employeeType)}</Definition>
        <Definition labelText="Status">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500" />
            {label(employee.status)}
          </span>
        </Definition>
        <Definition labelText="Joining date">{formatDate(employee.joiningDate)}</Definition>
        <Definition labelText="Employee ID">{employee.employeeCode ?? "—"}</Definition>
      </dl>

      {history.length > 1 && (
        <div className="mt-8 border-t border-outline-variant/30 pt-6">
          <dt className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
            Employee ID history
          </dt>
          <ul className="flex flex-col gap-2">
            {history.map((entry) => (
              <li
                key={entry.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-highest/40 px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-on-surface">{entry.code}</span>
                <span className="text-xs text-on-surface-variant">{employeeTypeLabel(entry.employeeType)}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  {entry.retiredAt ? (
                    <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-on-surface-variant">
                      Retired {formatDate(entry.retiredAt)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">Active</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
