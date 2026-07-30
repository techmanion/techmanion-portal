import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { ConfirmDialog, EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { CandidatesTable, FilterToolbar, JobsTable, PageHeader } from "../components/organisms";
import { useHiringData } from "../hooks/useHiringData";
import { useSearchParamState } from "../hooks/useSearchParamState";
import { label } from "../lib/format";
import { CANDIDATE_STAGES } from "../lib/options";
import { useToast } from "../toast";
import type { Candidate, CandidateStage, Job } from "../types";

const tabs = ["Candidates", "Jobs"] as const;
type Tab = (typeof tabs)[number];

export function HiringPage() {
  const navigate = useNavigate();
  const [tabParam, setTabParam] = useSearchParamState("tab", "candidates");
  const activeTab: Tab = tabParam === "jobs" ? "Jobs" : "Candidates";
  function setActiveTab(tab: Tab) {
    setTabParam(tab.toLowerCase());
  }

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
    removeJob,
    removeCandidate,
  } = useHiringData();

  const [jobSearch, setJobSearch] = useState("");
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<Job | null>(null);
  const [confirmDeleteCandidate, setConfirmDeleteCandidate] = useState<Candidate | null>(null);
  const toast = useToast();

  const visibleJobs = jobs.filter(
    (job) => !jobSearch || job.title.toLowerCase().includes(jobSearch.toLowerCase()),
  );

  async function handleDeleteJob() {
    if (!confirmDeleteJob) return;
    const job = confirmDeleteJob;
    setConfirmDeleteJob(null);
    try {
      await removeJob(job);
      toast.success("Job deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be deleted.");
    }
  }

  async function handleDeleteCandidate() {
    if (!confirmDeleteCandidate) return;
    const candidate = confirmDeleteCandidate;
    setConfirmDeleteCandidate(null);
    try {
      await removeCandidate(candidate);
      toast.success("Candidate deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be deleted.");
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Hiring"
        description="Track candidates and open roles."
        actions={
          activeTab === "Candidates" ? (
            <Link
              to="/hiring/candidates/new"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"
            >
              <Icon className="text-[18px]">add</Icon>
              Add candidate
            </Link>
          ) : (
            <Link
              to="/hiring/jobs/new"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"
            >
              <Icon className="text-[18px]">add</Icon>
              New job
            </Link>
          )
        }
      />

      <nav className="mb-6 flex gap-8 border-b border-outline-variant/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative whitespace-nowrap pb-3 text-sm font-medium tracking-wide transition ${
              activeTab === tab ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {error && (
        <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {activeTab === "Candidates" && (
        <section className="surface-panel overflow-hidden">
          <div className="bg-surface-container-high/30 px-6 py-4">
            <FilterToolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search candidates..."
                className="lg:max-w-[380px]"
              />
              <FilterSelect
                value={stageFilter}
                onChange={(value) => setStageFilter(value as CandidateStage | "")}
                labelText="Stage"
              >
                <option value="">Stage</option>
                {CANDIDATE_STAGES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </FilterSelect>
              {(search || stageFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStageFilter("");
                  }}
                >
                  <Icon className="text-[16px]">filter_alt_off</Icon>
                  Clear filters
                </Button>
              )}
            </FilterToolbar>
          </div>

          {loadingCandidates ? (
            <div className="grid min-h-40 place-items-center">
              <Loading />
            </div>
          ) : candidates.length ? (
            <CandidatesTable
              candidates={candidates}
              onConvert={(candidate) => navigate(`/hiring/candidates/${candidate.id}/convert`)}
              onEdit={(candidate) => navigate(`/hiring/candidates/${candidate.id}/edit`)}
              onDelete={setConfirmDeleteCandidate}
            />
          ) : (
            <EmptyState>No candidates match the selected filters.</EmptyState>
          )}
        </section>
      )}

      {activeTab === "Jobs" && (
        <section className="surface-panel overflow-hidden">
          <div className="bg-surface-container-high/30 px-6 py-4">
            <FilterToolbar>
              <SearchInput
                value={jobSearch}
                onChange={setJobSearch}
                placeholder="Search jobs..."
                className="lg:max-w-[380px]"
              />
              {jobSearch && (
                <Button variant="ghost" size="sm" onClick={() => setJobSearch("")}>
                  <Icon className="text-[16px]">filter_alt_off</Icon>
                  Clear filters
                </Button>
              )}
            </FilterToolbar>
          </div>

          {loadingJobs ? (
            <div className="grid min-h-40 place-items-center">
              <Loading />
            </div>
          ) : visibleJobs.length ? (
            <JobsTable
              jobs={visibleJobs}
              onEdit={(job) => navigate(`/hiring/jobs/${job.id}/edit`)}
              onDelete={setConfirmDeleteJob}
            />
          ) : jobs.length ? (
            <EmptyState>No jobs match the selected filters.</EmptyState>
          ) : (
            <EmptyState>No open jobs yet.</EmptyState>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmDeleteJob !== null}
        title="Delete this job?"
        description={
          confirmDeleteJob
            ? `"${confirmDeleteJob.title}" and its candidates will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete job"
        onConfirm={handleDeleteJob}
        onCancel={() => setConfirmDeleteJob(null)}
      />
      <ConfirmDialog
        open={confirmDeleteCandidate !== null}
        title="Delete this candidate?"
        description={
          confirmDeleteCandidate
            ? `"${confirmDeleteCandidate.fullName}" will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete candidate"
        onConfirm={handleDeleteCandidate}
        onCancel={() => setConfirmDeleteCandidate(null)}
      />
    </div>
  );
}
