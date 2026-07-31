import { Link } from "react-router-dom";
import { Icon, Select } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { formatDate, label } from "../../lib/format";
import { CANDIDATE_STAGES } from "../../lib/options";
import type { Candidate, CandidateStage } from "../../types";

export function CandidateDetailPanel({ candidate, onStageChange }: { candidate: Candidate; onStageChange: (stage: CandidateStage) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="surface-panel p-6 lg:col-span-2">
        <SectionHeading className="mb-5">Overview</SectionHeading>
        <dl className="grid gap-5 md:grid-cols-2">
          <div><dt className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">Email</dt><dd className="text-sm text-on-surface"><a href={`mailto:${candidate.email}`} className="hover:text-primary">{candidate.email}</a></dd></div>
          <div><dt className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">Phone</dt><dd className="text-sm text-on-surface">{candidate.phone || "—"}</dd></div>
          <div><dt className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">Job</dt><dd className="text-sm font-medium"><Link to={`/hiring/jobs/${candidate.jobId}`} className="text-on-surface hover:text-primary">{candidate.jobTitle}</Link></dd></div>
          <div><dt className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">Stage</dt><dd><Select aria-label="Candidate stage" value={candidate.stage} disabled={candidate.stage === "HIRED"} onChange={(event) => onStageChange(event.target.value as CandidateStage)} className="!h-9 max-w-48">{CANDIDATE_STAGES.filter((stage) => stage !== "HIRED" || candidate.stage === "HIRED").map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</Select></dd></div>
        </dl>
        {candidate.resume && <a href={candidate.resume} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Icon className="text-[18px]">description</Icon>Open resume</a>}
      </section>
      <section className="surface-panel p-6">
        <SectionHeading className="mb-5">Interview</SectionHeading>
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon>event</Icon></span><div><strong className="block text-sm text-on-surface">{candidate.interviewDate ? formatDate(candidate.interviewDate) : "Not scheduled"}</strong><span className="mt-1 block text-xs text-on-surface-variant">{candidate.interviewDate ? "Interview date" : "Add a date from Edit candidate"}</span></div></div>
      </section>
      <section className="surface-panel p-6 lg:col-span-3">
        <SectionHeading className="mb-5">Notes</SectionHeading>
        <p className="whitespace-pre-wrap text-sm leading-7 text-on-surface">{candidate.notes || "No notes added."}</p>
      </section>
    </div>
  );
}
