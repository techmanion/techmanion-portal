import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Icon, IconButton, Input, Loading, Select, Textarea } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { EmployeeCell } from "../components/molecules/EmployeeCell";
import { EmptyState, FilterSelect, FormField, SearchInput } from "../components/molecules";
import { DataTable, FilterToolbar, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate, label } from "../lib/format";
import type {
  Candidate,
  CandidatePayload,
  CandidateStage,
  ConvertToEmployeePayload,
  Job,
  JobPayload,
  JobStatus,
  NamedOption,
} from "../types";

const tabs = ["Candidates", "Jobs"] as const;
type Tab = (typeof tabs)[number];

const stages: CandidateStage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
const jobStatuses: JobStatus[] = ["OPEN", "CLOSED"];

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [error, setError] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<CandidateStage | "">("");

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState<JobPayload>(emptyJobForm);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);

  const [showCandidateForm, setShowCandidateForm] = useState(addCandidateRequested);
  const [candidateForm, setCandidateForm] = useState<CandidatePayload>(emptyCandidateForm);
  const [editingCandidateId, setEditingCandidateId] = useState<number | null>(null);

  const [convertingCandidateId, setConvertingCandidateId] = useState<number | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertToEmployeePayload>(emptyConvertForm);

  function loadJobs() {
    api<Job[]>("/jobs")
      .then(setJobs)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingJobs(false));
  }

  const loadCandidates = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    api<Candidate[]>(`/candidates?${params}`)
      .then(setCandidates)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingCandidates(false));
  }, [search, stageFilter]);

  useEffect(() => {
    api<Job[]>("/jobs")
      .then((rows) => {
        setJobs(rows);
        if (addCandidateRequested) {
          setCandidateForm((current) => ({
            ...current,
            jobId:
              current.jobId ||
              rows.find((job) => job.status === "OPEN")?.id ||
              rows[0]?.id ||
              0,
          }));
        }
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingJobs(false));
  }, [addCandidateRequested]);
  useEffect(() => {
    api<NamedOption[]>("/settings/designations").then(setDesignations).catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(loadCandidates, 180);
    return () => window.clearTimeout(timer);
  }, [loadCandidates]);

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
      if (editingJobId) {
        await api(`/jobs/${editingJobId}`, { method: "PUT", body: JSON.stringify(jobForm) });
      } else {
        await api("/jobs", { method: "POST", body: JSON.stringify(jobForm) });
      }
      setShowJobForm(false);
      setJobForm(emptyJobForm);
      setEditingJobId(null);
      loadJobs();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be saved.");
    }
  }

  async function deleteJob(job: Job) {
    if (!window.confirm(`Delete "${job.title}"? This also removes its candidates.`)) return;
    try {
      await api(`/jobs/${job.id}`, { method: "DELETE" });
      loadJobs();
      loadCandidates();
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
      if (editingCandidateId) {
        await api(`/candidates/${editingCandidateId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/candidates", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowCandidateForm(false);
      setCandidateForm(emptyCandidateForm);
      setEditingCandidateId(null);
      loadCandidates();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be saved.");
    }
  }

  async function deleteCandidate(candidate: Candidate) {
    if (!window.confirm(`Delete candidate "${candidate.fullName}"?`)) return;
    try {
      await api(`/candidates/${candidate.id}`, { method: "DELETE" });
      loadCandidates();
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
      await api(`/candidates/${convertingCandidateId}/convert`, {
        method: "POST",
        body: JSON.stringify(convertForm),
      });
      setConvertingCandidateId(null);
      loadCandidates();
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
            {activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />}
          </button>
        ))}
      </nav>

      {error && <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      {activeTab === "Candidates" && (
        <>
          {showCandidateForm && (
            <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3" onSubmit={submitCandidate}>
              <FormField label="Full name"><Input value={candidateForm.fullName} onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })} required /></FormField>
              <FormField label="Email"><Input type="email" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} required /></FormField>
              <FormField label="Phone"><Input value={candidateForm.phone ?? ""} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} /></FormField>
              <FormField label="Job">
                <Select value={candidateForm.jobId || ""} onChange={(e) => setCandidateForm({ ...candidateForm, jobId: Number(e.target.value) })} required>
                  <option value="" disabled>Select job</option>
                  {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                </Select>
              </FormField>
              <FormField label="Stage">
                <Select value={candidateForm.stage} onChange={(e) => setCandidateForm({ ...candidateForm, stage: e.target.value as CandidateStage })}>
                  {stages.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </Select>
              </FormField>
              <FormField label="Interview date"><Input type="date" value={candidateForm.interviewDate ?? ""} onChange={(e) => setCandidateForm({ ...candidateForm, interviewDate: e.target.value })} /></FormField>
              <FormField label="Resume link"><Input value={candidateForm.resume ?? ""} onChange={(e) => setCandidateForm({ ...candidateForm, resume: e.target.value })} /></FormField>
              <FormField label="Notes" className="md:col-span-2 xl:col-span-3"><Textarea value={candidateForm.notes ?? ""} onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })} /></FormField>
              <div className="flex gap-2.5 md:col-span-2 xl:col-span-3">
                <Button type="submit">{editingCandidateId ? "Save changes" : "Add candidate"}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowCandidateForm(false); setEditingCandidateId(null); }}>Cancel</Button>
              </div>
            </form>
          )}

          {convertingCandidateId && (
            <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3" onSubmit={submitConvert}>
              <FormField label="Employment type">
                <Select value={convertForm.employeeType} onChange={(e) => setConvertForm({ ...convertForm, employeeType: e.target.value as ConvertToEmployeePayload["employeeType"] })}>
                  {["FULL_TIME", "PART_TIME", "CONTRACT"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </Select>
              </FormField>
              <FormField label="Joining date"><Input type="date" value={convertForm.joiningDate} onChange={(e) => setConvertForm({ ...convertForm, joiningDate: e.target.value })} required /></FormField>
              <FormField label="Job title">
                <Select value={convertForm.designationId ?? ""} onChange={(e) => setConvertForm({ ...convertForm, designationId: Number(e.target.value) || undefined })}>
                  <option value="">Select job title</option>
                  {designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Monthly compensation"><Input type="number" min="0" value={(convertForm.baseAmount ?? 0) / 100} onChange={(e) => setConvertForm({ ...convertForm, baseAmount: Math.round(Number(e.target.value) * 100) })} required /></FormField>
              <FormField label="Currency"><Input value={convertForm.currency} maxLength={3} onChange={(e) => setConvertForm({ ...convertForm, currency: e.target.value.toUpperCase() })} required /></FormField>
              <div className="flex items-end gap-2.5">
                <Button type="submit">Convert to employee</Button>
                <Button type="button" variant="ghost" onClick={() => setConvertingCandidateId(null)}>Cancel</Button>
              </div>
            </form>
          )}

          <section className="surface-panel overflow-hidden">
            <div className="bg-surface-container-high/30 px-6 py-4">
              <FilterToolbar>
                <SearchInput value={search} onChange={setSearch} placeholder="Search candidates..." className="lg:max-w-[380px]" />
                <FilterSelect value={stageFilter} onChange={(value) => setStageFilter(value as CandidateStage | "")} labelText="Stage">
                  <option value="">Stage</option>
                  {stages.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </FilterSelect>
              </FilterToolbar>
            </div>

            {loadingCandidates ? (
              <div className="grid min-h-40 place-items-center"><Loading /></div>
            ) : candidates.length ? (
              <DataTable minWidth="1000px">
                <thead>
                  <TableHeadRow>
                    <th className="px-6 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Interview date</th>
                    <th className="w-32 px-4 py-3" />
                  </TableHeadRow>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <td className="px-6"><EmployeeCell name={candidate.fullName} subtitle={candidate.email} /></td>
                      <td className="px-4 text-sm text-on-surface">{candidate.jobTitle}</td>
                      <td className="px-4"><StatusChip value={candidate.stage} /></td>
                      <td className="px-4 text-sm text-on-surface">{formatDate(candidate.interviewDate)}</td>
                      <td className="px-4">
                        <div className="flex items-center justify-end gap-1">
                          {candidate.stage !== "HIRED" && (
                            <IconButton aria-label="Convert to employee" title="Convert to employee" size="sm" onClick={() => startConvert(candidate)}>
                              <Icon className="text-[16px]">person_add</Icon>
                            </IconButton>
                          )}
                          <IconButton aria-label="Edit candidate" size="sm" onClick={() => startEditCandidate(candidate)}>
                            <Icon className="text-[16px]">edit</Icon>
                          </IconButton>
                          <IconButton aria-label="Delete candidate" size="sm" onClick={() => deleteCandidate(candidate)}>
                            <Icon className="text-[16px]">delete</Icon>
                          </IconButton>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>No candidates match the selected filters.</EmptyState>
            )}
          </section>
        </>
      )}

      {activeTab === "Jobs" && (
        <>
          {showJobForm && (
            <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2" onSubmit={submitJob}>
              <FormField label="Title"><Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required /></FormField>
              <FormField label="Status">
                <Select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value as JobStatus })}>
                  {jobStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </Select>
              </FormField>
              <FormField label="Description" className="md:col-span-2"><Textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required /></FormField>
              <div className="flex gap-2.5 md:col-span-2">
                <Button type="submit">{editingJobId ? "Save changes" : "Create job"}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowJobForm(false); setEditingJobId(null); }}>Cancel</Button>
              </div>
            </form>
          )}

          <section className="surface-panel overflow-hidden">
            {loadingJobs ? (
              <div className="grid min-h-40 place-items-center"><Loading /></div>
            ) : jobs.length ? (
              <DataTable minWidth="800px">
                <thead>
                  <TableHeadRow>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="w-24 px-4 py-3" />
                  </TableHeadRow>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <td className="px-6 text-sm font-medium text-on-surface">{job.title}</td>
                      <td className="max-w-md truncate px-4 text-sm text-on-surface-variant">{job.description}</td>
                      <td className="px-4"><StatusChip value={job.status} /></td>
                      <td className="px-4">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton aria-label="Edit job" size="sm" onClick={() => startEditJob(job)}>
                            <Icon className="text-[16px]">edit</Icon>
                          </IconButton>
                          <IconButton aria-label="Delete job" size="sm" onClick={() => deleteJob(job)}>
                            <Icon className="text-[16px]">delete</Icon>
                          </IconButton>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>No open jobs yet.</EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  );
}
