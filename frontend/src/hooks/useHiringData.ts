import { useCallback, useEffect, useState } from "react";
import {
  convertCandidate as convertCandidateRequest,
  createCandidate as createCandidateRequest,
  createJob as createJobRequest,
  deleteCandidate as deleteCandidateRequest,
  deleteJob as deleteJobRequest,
  listCandidates,
  listDesignations,
  listJobs,
  updateCandidate as updateCandidateRequest,
  updateJob as updateJobRequest,
} from "../lib/api";
import type {
  Candidate,
  CandidatePayload,
  CandidateStage,
  ConvertToEmployeePayload,
  Job,
  JobPayload,
  NamedOption,
} from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

export function useHiringData() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 180);
  const [stageFilter, setStageFilter] = useState<CandidateStage | "">("");

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
    listDesignations().then(setDesignations).catch(() => undefined);
  }, []);
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function saveJob(payload: JobPayload, editingId: number | null) {
    if (editingId) await updateJobRequest(editingId, payload);
    else await createJobRequest(payload);
    loadJobs();
  }

  async function removeJob(job: Job) {
    await deleteJobRequest(job.id);
    loadJobs();
    loadCandidates();
  }

  async function saveCandidate(payload: CandidatePayload, editingId: number | null) {
    if (editingId) await updateCandidateRequest(editingId, payload);
    else await createCandidateRequest(payload);
    loadCandidates();
  }

  async function removeCandidate(candidate: Candidate) {
    await deleteCandidateRequest(candidate.id);
    loadCandidates();
  }

  async function convertCandidateToEmployee(
    candidateId: number,
    payload: ConvertToEmployeePayload,
  ) {
    await convertCandidateRequest(candidateId, payload);
    loadCandidates();
  }

  return {
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
  };
}
