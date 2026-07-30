import { SectionHeading } from "../atoms/Typography";
import { formatDate } from "../../lib/format";
import type { Project } from "../../types";

export function ProjectInfoPanel({ project }: { project: Project }) {
  return (
    <section className="surface-panel mb-8 p-6">
      <SectionHeading className="mb-6">Project Information</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        <div>
          <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
            Start date
          </dt>
          <dd className="text-sm text-on-surface">{formatDate(project.startDate)}</dd>
        </div>
        <div>
          <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant/70">
            Target end date
          </dt>
          <dd className="text-sm text-on-surface">{formatDate(project.endDate)}</dd>
        </div>
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
