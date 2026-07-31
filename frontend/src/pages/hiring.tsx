import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { ConfirmDialog, EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { CandidatesTable, FilterToolbar, JobsTable, PageHeader } from "../components/organisms";
import { useHiringData } from "../hooks/useHiringData";
import { useSearchParamState } from "../hooks/useSearchParamState";
import { label } from "../lib/format";
import { CANDIDATE_STAGES, JOB_STATUSES } from "../lib/options";
import { useToast } from "../toast";
import type { Candidate, CandidateStage, Job } from "../types";

const tabs = ["Candidates", "Jobs"] as const;
type Tab = (typeof tabs)[number];

export function HiringPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tabParam, setTabParam] = useSearchParamState("tab", "candidates");
  const activeTab: Tab = tabParam === "jobs" ? "Jobs" : "Candidates";
  const {
    jobs,
    candidates,
    loadingJobs,
    loadingCandidates,
    error,
    setError,
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    jobFilter,
    setJobFilter,
    interviewFilter,
    setInterviewFilter,
    changeCandidateStage,
    removeJob,
    removeCandidate,
  } = useHiringData();
  const [jobSearch, setJobSearch] = useSearchParamState("job_search");
  const [department, setDepartment] = useSearchParamState("department");
  const [location, setLocation] = useSearchParamState("location");
  const [jobType, setJobType] = useSearchParamState("job_type");
  const [jobStatus, setJobStatus] = useSearchParamState("job_status");
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<Job | null>(null);
  const [confirmDeleteCandidate, setConfirmDeleteCandidate] = useState<Candidate | null>(null);

  const jobOptions = useMemo(() => ({
    departments: Array.from(new Set(jobs.map((job) => job.department))).sort(),
    locations: Array.from(new Set(jobs.map((job) => job.location))).sort(),
    types: Array.from(new Set(jobs.map((job) => job.type))).sort(),
  }), [jobs]);
  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const term = `${job.title} ${job.department} ${job.location} ${job.type} ${job.summary}`.toLowerCase();
    return (!jobSearch || term.includes(jobSearch.toLowerCase())) &&
      (!department || job.department === department) &&
      (!location || job.location === location) &&
      (!jobType || job.type === jobType) &&
      (!jobStatus || job.status === jobStatus);
  }), [jobs, jobSearch, department, location, jobType, jobStatus]);

  async function handleStage(candidate: Candidate, stage: CandidateStage) {
    try { await changeCandidateStage(candidate, stage); toast.success("Candidate stage updated."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Candidate stage could not be updated."); }
  }

  async function handleDeleteJob() {
    if (!confirmDeleteJob) return;
    const job = confirmDeleteJob;
    setConfirmDeleteJob(null);
    try { await removeJob(job); toast.success("Job deleted."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Job could not be deleted."); }
  }

  async function handleDeleteCandidate() {
    if (!confirmDeleteCandidate) return;
    const candidate = confirmDeleteCandidate;
    setConfirmDeleteCandidate(null);
    try { await removeCandidate(candidate); toast.success("Candidate deleted."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Candidate could not be deleted."); }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader className="mb-8 px-1" title="Hiring" description="Manage candidates and job openings." actions={<Link to={activeTab === "Candidates" ? "/hiring/candidates/new" : "/hiring/jobs/new"} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"><Icon className="text-[18px]">add</Icon>{activeTab === "Candidates" ? "Add candidate" : "New job"}</Link>} />
      <nav className="mb-6 flex gap-8 border-b border-outline-variant/60">{tabs.map((tab) => <button key={tab} onClick={() => setTabParam(tab.toLowerCase())} className={`relative whitespace-nowrap pb-3 text-sm font-medium tracking-wide transition ${activeTab === tab ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{tab}{activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />}</button>)}</nav>
      {error && <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      {activeTab === "Candidates" && <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4"><FilterToolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search candidates, jobs, or notes..." className="lg:max-w-[360px]" />
          <FilterSelect value={stageFilter} onChange={(value) => setStageFilter(value as CandidateStage | "")} labelText="Stage" placeholder="Filter by stage">{CANDIDATE_STAGES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</FilterSelect>
          <FilterSelect value={jobFilter} onChange={setJobFilter} labelText="Job" placeholder="Filter by job">{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</FilterSelect>
          <FilterSelect value={interviewFilter} onChange={setInterviewFilter} labelText="Interview" placeholder="Filter by interview"><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="scheduled">Scheduled</option><option value="unscheduled">Not scheduled</option></FilterSelect>
          {(search || stageFilter || jobFilter || interviewFilter) && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStageFilter(""); setJobFilter(""); setInterviewFilter(""); }}><Icon className="text-[16px]">filter_alt_off</Icon>Clear filters</Button>}
        </FilterToolbar></div>
        {loadingCandidates ? <div className="grid min-h-40 place-items-center"><Loading /></div> : candidates.length ? <CandidatesTable candidates={candidates} onOpen={(candidate) => navigate(`/hiring/candidates/${candidate.id}`)} onStageChange={handleStage} onConvert={(candidate) => navigate(`/hiring/candidates/${candidate.id}/convert`)} onEdit={(candidate) => navigate(`/hiring/candidates/${candidate.id}/edit`)} onDelete={setConfirmDeleteCandidate} /> : <EmptyState>No candidates match the selected filters.</EmptyState>}
      </section>}

      {activeTab === "Jobs" && <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4"><FilterToolbar>
          <SearchInput value={jobSearch} onChange={setJobSearch} placeholder="Search jobs, departments, or locations..." className="lg:max-w-[340px]" />
          <FilterSelect value={department} onChange={setDepartment} labelText="Department" placeholder="Filter by department">{jobOptions.departments.map((value) => <option key={value}>{value}</option>)}</FilterSelect>
          <FilterSelect value={location} onChange={setLocation} labelText="Location" placeholder="Filter by location">{jobOptions.locations.map((value) => <option key={value}>{value}</option>)}</FilterSelect>
          <FilterSelect value={jobType} onChange={setJobType} labelText="Type" placeholder="Filter by type">{jobOptions.types.map((value) => <option key={value}>{value}</option>)}</FilterSelect>
          <FilterSelect value={jobStatus} onChange={setJobStatus} labelText="Status" placeholder="Filter by status">{JOB_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</FilterSelect>
          {(jobSearch || department || location || jobType || jobStatus) && <Button variant="ghost" size="sm" onClick={() => { setJobSearch(""); setDepartment(""); setLocation(""); setJobType(""); setJobStatus(""); }}><Icon className="text-[16px]">filter_alt_off</Icon>Clear filters</Button>}
        </FilterToolbar></div>
        {loadingJobs ? <div className="grid min-h-40 place-items-center"><Loading /></div> : visibleJobs.length ? <JobsTable jobs={visibleJobs} onOpen={(job) => navigate(`/hiring/jobs/${job.id}`)} onEdit={(job) => navigate(`/hiring/jobs/${job.id}/edit`)} onDelete={setConfirmDeleteJob} /> : <EmptyState>{jobs.length ? "No jobs match the selected filters." : "No jobs yet."}</EmptyState>}
      </section>}

      <ConfirmDialog open={confirmDeleteJob !== null} title="Delete this job?" description={confirmDeleteJob ? `"${confirmDeleteJob.title}" and its candidates will be permanently removed.` : undefined} confirmLabel="Delete job" onConfirm={handleDeleteJob} onCancel={() => setConfirmDeleteJob(null)} />
      <ConfirmDialog open={confirmDeleteCandidate !== null} title="Delete this candidate?" description={confirmDeleteCandidate ? `"${confirmDeleteCandidate.fullName}" will be permanently removed.` : undefined} confirmLabel="Delete candidate" onConfirm={handleDeleteCandidate} onCancel={() => setConfirmDeleteCandidate(null)} />
    </div>
  );
}
