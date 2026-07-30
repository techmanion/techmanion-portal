import { useCallback, useEffect, useState } from "react";
import { deleteCandidate as deleteCandidateRequest, deleteJob as deleteJobRequest, listCandidates, listJobs } from "../lib/api";
import type { Candidate, Job } from "../types";
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
    return listCandidates(params.toString())
      .then(setCandidates)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingCandidates(false));
  }, [debouncedSearch, stageFilter]);

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
    removeJob,
    removeCandidate,
  };
}
