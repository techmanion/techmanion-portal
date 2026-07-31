import { useCallback, useEffect, useState } from "react";
import { deleteCandidate as deleteCandidateRequest, deleteJob as deleteJobRequest, listCandidates, listJobs, updateCandidateStage } from "../lib/api";
import type { Candidate, CandidateStage, Job } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";
import { useSearchParamState } from "./useSearchParamState";

export function useHiringData() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useSearchParamState("search");
  const debouncedSearch = useDebouncedValue(search, 180);
  const [stageFilter, setStageFilter] = useSearchParamState("stage");
  const [jobFilter, setJobFilter] = useSearchParamState("job");
  const [interviewFilter, setInterviewFilter] = useSearchParamState("interview");

  const loadJobs = useCallback(() => {
    return listJobs()
      .then(setJobs)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingJobs(false));
  }, []);

  const loadCandidates = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (stageFilter) params.set("stage", stageFilter);
    if (jobFilter) params.set("job_id", jobFilter);
    if (interviewFilter) params.set("interview", interviewFilter);
    return listCandidates(params.toString())
      .then(setCandidates)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingCandidates(false));
  }, [debouncedSearch, stageFilter, jobFilter, interviewFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function removeJob(job: Job) {
    await deleteJobRequest(job.id);
    loadJobs();
    loadCandidates();
  }

  async function removeCandidate(candidate: Candidate) {
    await deleteCandidateRequest(candidate.id);
    loadCandidates();
  }

  async function changeCandidateStage(candidate: Candidate, stage: CandidateStage) {
    const updated = await updateCandidateStage(candidate.id, stage);
    setCandidates((current) => current.map((row) => (row.id === updated.id ? updated : row)));
  }

  return {
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
  };
}
