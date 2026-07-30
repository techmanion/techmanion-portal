import type { ReactNode } from "react";
import { SectionHeading } from "../atoms/Typography";
import { formatDate, label } from "../../lib/format";
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
  return (
    <section className="surface-panel mt-8 max-w-5xl p-6">
      <SectionHeading className="mb-6">Employee Information</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        <Definition labelText="Full name">{employee.fullName}</Definition>
        <Definition labelText="Email">{employee.email}</Definition>
        <Definition labelText="Phone">{employee.phone}</Definition>
        <Definition labelText="Job title">{employee.designation?.name ?? "—"}</Definition>
        <Definition labelText="Employment type">{label(employee.employeeType)}</Definition>
        <Definition labelText="Status">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500" />
            {label(employee.status)}
          </span>
        </Definition>
        <Definition labelText="Joining date">{formatDate(employee.joiningDate)}</Definition>
      </dl>
    </section>
  );
}
