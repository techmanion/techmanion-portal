import { Icon } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import type { Job } from "../../types";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="surface-panel p-6">
      <SectionHeading className="mb-5">{title}</SectionHeading>
      {items.length ? (
        <ul className="space-y-3 text-sm leading-6 text-on-surface">
          {items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3"><Icon className="mt-1 text-[16px] text-primary">check_circle</Icon><span>{item}</span></li>)}
        </ul>
      ) : <p className="text-sm text-on-surface-variant">No {title.toLowerCase()} listed.</p>}
    </section>
  );
}

export function JobDetailPanel({ job }: { job: Job }) {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <SectionHeading className="mb-5">Overview</SectionHeading>
        <dl className="grid gap-5 md:grid-cols-3">
          {[['Department', job.department], ['Location', job.location], ['Type', job.type]].map(([term, value]) => <div key={term}><dt className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">{term}</dt><dd className="text-sm text-on-surface">{value}</dd></div>)}
        </dl>
        <p className="mt-6 text-sm font-medium leading-6 text-on-surface">{job.summary}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">{job.description}</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListSection title="Responsibilities" items={job.responsibilities} />
        <ListSection title="Requirements" items={job.requirements} />
      </div>
      <section className="surface-panel p-6">
        <SectionHeading className="mb-4">Application Link</SectionHeading>
        {job.applicationLink ? <a href={job.applicationLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Icon className="text-[18px]">open_in_new</Icon>Open application page</a> : <p className="text-sm text-on-surface-variant">No application link provided.</p>}
      </section>
    </div>
  );
}
