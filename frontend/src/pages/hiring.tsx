import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import {
  CandidateFormPanel,
  CandidatesTable,
  ConvertCandidateFormPanel,
  FilterToolbar,
  JobFormPanel,
  JobsTable,
  PageHeader,
} from "../components/organisms";
import { useHiringData } from "../hooks/useHiringData";
import { label } from "../lib/format";
import { CANDIDATE_STAGES } from "../lib/options";
import type { Candidate, CandidatePayload, CandidateStage, ConvertToEmployeePayload, Job, JobPayload } from "../types";

const tabs = ["Candidates", "Jobs"] as const;
type Tab = (typeof tabs)[number];

const emptyJobForm: JobPayload = { title: "", description: "", status: "OPEN" };
const emptyCandidateForm: CandidatePayload = {
  fullName: "",
  email: "",
  phone: "",
  jobId: 0,
  stage: "APPLIED",
  resume: "",
  interviewDate: "",
  notes: "",
};
const emptyConvertForm: ConvertToEmployeePayload = {
  employeeType: "FULL_TIME",
  joiningDate: new Date().toISOString().slice(0, 10),
  designationId: undefined,
  baseAmount: 0,
  currency: "PKR",
};

export function HiringPage() {
  const [searchParams] = useSearchParams();
  const addCandidateRequested = searchParams.get("action") === "add-candidate";
  const [activeTab, setActiveTab] = useState<Tab>("Candidates");

  const {
    jobs,
    candidates,
    designations,
    loadingJobs,
    loadingCandidates,
    error,
    setError,
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    saveJob,
    removeJob,
    saveCandidate,
    removeCandidate,
    convertCandidateToEmployee,
  } = useHiringData();

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState<JobPayload>(emptyJobForm);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);

  const [showCandidateForm, setShowCandidateForm] = useState(addCandidateRequested);
  const [candidateForm, setCandidateForm] = useState<CandidatePayload>(emptyCandidateForm);
  const [editingCandidateId, setEditingCandidateId] = useState<number | null>(null);

  const [convertingCandidateId, setConvertingCandidateId] = useState<number | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertToEmployeePayload>(emptyConvertForm);

  useEffect(() => {
    function applyDefaultJob() {
      if (!addCandidateRequested || !jobs.length || candidateForm.jobId) return;
      setCandidateForm((current) => ({
        ...current,
        jobId: jobs.find((job) => job.status === "OPEN")?.id ?? jobs[0]?.id ?? 0,
      }));
    }
    applyDefaultJob();
  }, [addCandidateRequested, jobs, candidateForm.jobId]);

  const openJobs = useMemo(() => jobs.filter((job) => job.status === "OPEN"), [jobs]);

  function startCreateJob() {
    setEditingJobId(null);
    setJobForm(emptyJobForm);
    setShowJobForm(true);
  }

  function startEditJob(job: Job) {
    setEditingJobId(job.id);
    setJobForm({ title: job.title, description: job.description, status: job.status });
    setShowJobForm(true);
  }

  async function submitJob(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveJob(jobForm, editingJobId);
      setShowJobForm(false);
      setJobForm(emptyJobForm);
      setEditingJobId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be saved.");
    }
  }

  async function handleDeleteJob(job: Job) {
    if (!window.confirm(`Delete "${job.title}"? This also removes its candidates.`)) return;
    try {
      await removeJob(job);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be deleted.");
    }
  }

  function startCreateCandidate() {
    setEditingCandidateId(null);
    setCandidateForm({ ...emptyCandidateForm, jobId: openJobs[0]?.id ?? jobs[0]?.id ?? 0 });
    setShowCandidateForm(true);
  }

  function startEditCandidate(candidate: Candidate) {
    setEditingCandidateId(candidate.id);
    setCandidateForm({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone ?? "",
      jobId: candidate.jobId,
      stage: candidate.stage,
      resume: candidate.resume ?? "",
      interviewDate: candidate.interviewDate ?? "",
      notes: candidate.notes ?? "",
    });
    setShowCandidateForm(true);
  }

  async function submitCandidate(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = { ...candidateForm, jobId: Number(candidateForm.jobId) };
      await saveCandidate(payload, editingCandidateId);
      setShowCandidateForm(false);
      setCandidateForm(emptyCandidateForm);
      setEditingCandidateId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be saved.");
    }
  }

  async function handleDeleteCandidate(candidate: Candidate) {
    if (!window.confirm(`Delete candidate "${candidate.fullName}"?`)) return;
    try {
      await removeCandidate(candidate);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be deleted.");
    }
  }

  function startConvert(candidate: Candidate) {
    setConvertingCandidateId(candidate.id);
    setConvertForm(emptyConvertForm);
  }

  async function submitConvert(event: React.FormEvent) {
    event.preventDefault();
    if (!convertingCandidateId) return;
    try {
      await convertCandidateToEmployee(convertingCandidateId, convertForm);
      setConvertingCandidateId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be converted.");
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
            <Button size="lg" onClick={startCreateCandidate}>
              <Icon className="text-[18px]">add</Icon>
              Add candidate
            </Button>
          ) : (
            <Button size="lg" onClick={startCreateJob}>
              <Icon className="text-[18px]">add</Icon>
              New job
            </Button>
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
        <>
          {showCandidateForm && (
            <CandidateFormPanel
              form={candidateForm}
              jobs={jobs}
              editing={editingCandidateId !== null}
              onChange={setCandidateForm}
              onSubmit={submitCandidate}
              onCancel={() => {
                setShowCandidateForm(false);
                setEditingCandidateId(null);
              }}
            />
          )}

          {convertingCandidateId && (
            <ConvertCandidateFormPanel
              form={convertForm}
              designations={designations}
              onChange={setConvertForm}
              onSubmit={submitConvert}
              onCancel={() => setConvertingCandidateId(null)}
            />
          )}

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
              </FilterToolbar>
            </div>

            {loadingCandidates ? (
              <div className="grid min-h-40 place-items-center">
                <Loading />
              </div>
            ) : candidates.length ? (
              <CandidatesTable
                candidates={candidates}
                onConvert={startConvert}
                onEdit={startEditCandidate}
                onDelete={handleDeleteCandidate}
              />
            ) : (
              <EmptyState>No candidates match the selected filters.</EmptyState>
            )}
          </section>
        </>
      )}

      {activeTab === "Jobs" && (
        <>
          {showJobForm && (
            <JobFormPanel
              form={jobForm}
              editing={editingJobId !== null}
              onChange={setJobForm}
              onSubmit={submitJob}
              onCancel={() => {
                setShowJobForm(false);
                setEditingJobId(null);
              }}
            />
          )}

          <section className="surface-panel overflow-hidden">
            {loadingJobs ? (
              <div className="grid min-h-40 place-items-center">
                <Loading />
              </div>
            ) : jobs.length ? (
              <JobsTable jobs={jobs} onEdit={startEditJob} onDelete={handleDeleteJob} />
            ) : (
              <EmptyState>No open jobs yet.</EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  );
}
