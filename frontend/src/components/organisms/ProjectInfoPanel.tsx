import { SectionHeading } from "../atoms/Typography";
import { formatDate, formatMoney, label } from "../../lib/format";
import type { Project } from "../../types";

function Detail({ labelText, children }: { labelText: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
        {labelText}
      </dt>
      <dd className="text-sm text-on-surface">{children}</dd>
    </div>
  );
}

export function ProjectInfoPanel({ project }: { project: Project }) {
  return (
    <section className="surface-panel mb-8 p-6">
      <SectionHeading className="mb-6">Project Information</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        <Detail labelText="Type">{label(project.projectType)}</Detail>
        <Detail labelText="Start date">{formatDate(project.startDate)}</Detail>
        <Detail labelText="End date">{formatDate(project.endDate ?? undefined)}</Detail>
        {project.projectType === "MONTHLY_RECURRING" && (
          <>
            <Detail labelText="Monthly amount">{formatMoney(project.monthlyAmount ?? 0)}</Detail>
            <Detail labelText="Billing day">Day {project.billingDay}</Detail>
            <Detail labelText="Auto renew">{project.autoRenew ? "Yes" : "No"}</Detail>
          </>
        )}
        {project.projectType === "FIXED" && (
          <Detail labelText="Contract value">{formatMoney(project.contractValue ?? 0)}</Detail>
        )}
        {project.projectType === "HOURLY" && (
          <>
            <Detail labelText="Hourly rate">{formatMoney(project.hourlyRate ?? 0)}</Detail>
            <Detail labelText="Estimated hours">{project.estimatedHours ?? "—"}</Detail>
            <Detail labelText="Logged hours">{project.loggedHours ?? 0}</Detail>
          </>
        )}
        {project.notes && (
          <div className="md:col-span-2">
            <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
              Notes
            </dt>
            <dd className="text-sm leading-6 text-on-surface">{project.notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
