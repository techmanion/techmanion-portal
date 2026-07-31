import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { Breadcrumb, ConfirmDialog, EmptyState } from "../components/molecules";
import { JobDetailPanel, PageHeader } from "../components/organisms";
import { deleteJob, getJob } from "../lib/api/hiring";
import { useToast } from "../toast";
import type { Job } from "../types";

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getJob(jobId!).then(setJob).catch((reason: Error) => setError(reason.message)); }, [jobId]);

  async function remove() {
    setConfirmDelete(false);
    try { await deleteJob(Number(jobId)); toast.success("Job deleted."); navigate("/hiring?tab=jobs"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Job could not be deleted."); }
  }

  if (!job && !error) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (!job) return <div className="p-6"><EmptyState>{error}</EmptyState></div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-7">
      <Breadcrumb to="/hiring?tab=jobs" trail={["Hiring", "Jobs", job.title]} />
      <PageHeader className="mb-8" title={job.title} description={`${job.department} · ${job.location} · ${job.type}`} meta={<StatusChip value={job.status} />} actions={<><Link to={`/hiring/jobs/${job.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"><Icon className="text-[16px]">edit</Icon>Edit</Link><Button variant="ghost" onClick={() => setConfirmDelete(true)}><Icon className="text-[16px]">delete</Icon>Delete</Button></>} />
      <JobDetailPanel job={job} />
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <ConfirmDialog open={confirmDelete} title="Delete this job?" description={`"${job.title}" and its candidates will be permanently removed.`} confirmLabel="Delete job" onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
    </div>
  );
}
