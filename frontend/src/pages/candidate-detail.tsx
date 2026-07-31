import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { Breadcrumb, ConfirmDialog, EmptyState } from "../components/molecules";
import { CandidateDetailPanel, PageHeader } from "../components/organisms";
import { deleteCandidate, getCandidate, updateCandidateStage } from "../lib/api/hiring";
import { useToast } from "../toast";
import type { Candidate, CandidateStage } from "../types";

export function CandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getCandidate(candidateId!).then(setCandidate).catch((reason: Error) => setError(reason.message)); }, [candidateId]);

  async function changeStage(stage: CandidateStage) {
    try { setCandidate(await updateCandidateStage(Number(candidateId), stage)); toast.success("Candidate stage updated."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Candidate stage could not be updated."); }
  }

  async function remove() {
    setConfirmDelete(false);
    try { await deleteCandidate(Number(candidateId)); toast.success("Candidate deleted."); navigate("/hiring?tab=candidates"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Candidate could not be deleted."); }
  }

  if (!candidate && !error) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (!candidate) return <div className="p-6"><EmptyState>{error}</EmptyState></div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-7">
      <Breadcrumb to="/hiring?tab=candidates" trail={["Hiring", "Candidates", candidate.fullName]} />
      <PageHeader className="mb-8" title={candidate.fullName} description={candidate.jobTitle} meta={<StatusChip value={candidate.stage} />} actions={<>{candidate.stage !== "HIRED" && <Link to={`/hiring/candidates/${candidate.id}/convert`} className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-on-primary"><Icon className="text-[16px]">person_add</Icon>Convert to employee</Link>}<Link to={`/hiring/candidates/${candidate.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"><Icon className="text-[16px]">edit</Icon>Edit</Link><Button variant="ghost" onClick={() => setConfirmDelete(true)}><Icon className="text-[16px]">delete</Icon>Delete</Button></>} />
      <CandidateDetailPanel candidate={candidate} onStageChange={changeStage} />
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <ConfirmDialog open={confirmDelete} title="Delete this candidate?" description={`"${candidate.fullName}" will be permanently removed.`} confirmLabel="Delete candidate" onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
    </div>
  );
}
