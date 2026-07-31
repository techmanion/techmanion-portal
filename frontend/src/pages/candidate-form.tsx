import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Loading, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { createCandidate, getCandidate, listJobs, updateCandidate } from "../lib/api/hiring";
import { label } from "../lib/format";
import { CANDIDATE_STAGES } from "../lib/options";
import { useToast } from "../toast";
import type { CandidatePayload, CandidateStage, Job } from "../types";

const emptyCandidate: CandidatePayload = {
  fullName: "",
  email: "",
  phone: "",
  jobId: 0,
  stage: "APPLIED",
  resume: "",
  interviewDate: "",
  notes: "",
};

export function CandidateFormPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(candidateId);
  const [form, setForm] = useState<CandidatePayload>(emptyCandidate);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const toast = useToast();
  const cancelTo = isEdit ? `/hiring/candidates/${candidateId}` : "/hiring?tab=candidates";

  useEffect(() => {
    listJobs().then((rows) => {
      setJobs(rows);
      if (!isEdit) {
        setForm((current) => ({
          ...current,
          jobId: current.jobId || rows.find((job) => job.status === "OPEN")?.id || rows[0]?.id || 0,
        }));
      }
    });
  }, [isEdit]);

  useEffect(() => {
    if (candidateId) {
      getCandidate(candidateId).then((candidate) => {
        setForm({
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone ?? "",
          jobId: candidate.jobId,
          stage: candidate.stage,
          resume: candidate.resume ?? "",
          interviewDate: candidate.interviewDate ?? "",
          notes: candidate.notes ?? "",
        });
      }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
    }
  }, [candidateId]);

  const title = useMemo(() => (isEdit ? "Edit candidate" : "Add candidate"), [isEdit]);

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;

  function set<K extends keyof CandidatePayload>(key: K, value: CandidatePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        jobId: Number(form.jobId),
        interviewDate: form.interviewDate || undefined,
      };
      const saved = isEdit
        ? await updateCandidate(Number(candidateId), payload)
        : await createCandidate(payload);
      toast.success(isEdit ? "Candidate updated." : "Candidate added.");
      navigate(`/hiring/candidates/${saved.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={isEdit ? ["Hiring", form.fullName || "Candidate", "Edit"] : ["Hiring", "Add candidate"]}
      title={title}
      description="Contact details, job, interview, and pipeline stage."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Add candidate"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Candidate details" bordered={false}>
        <FormField label="Full name">
          <Input value={form.fullName} onChange={(event) => set("fullName", event.target.value)} required />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Phone">
          <Input value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} />
        </FormField>
        <FormField label="Job">
          <Select
            value={form.jobId || ""}
            onChange={(event) => set("jobId", Number(event.target.value))}
            required
          >
            <option value="" disabled hidden>
              Select job
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Stage">
          <Select
            value={form.stage}
            disabled={form.stage === "HIRED"}
            onChange={(event) => set("stage", event.target.value as CandidateStage)}
          >
            {CANDIDATE_STAGES.filter((value) => value !== "HIRED" || form.stage === "HIRED").map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
      </FormSection>

      <FormSection heading="Interview and application" accent="tertiary">
        <FormField label="Interview date" hint="Optional">
          <Input
            type="date"
            value={form.interviewDate ?? ""}
            onChange={(event) => set("interviewDate", event.target.value)}
          />
        </FormField>
        <FormField label="Resume link">
          <Input type="url" value={form.resume ?? ""} onChange={(event) => set("resume", event.target.value)} placeholder="https://" />
        </FormField>
      </FormSection>

      <FormSection heading="Notes">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value)} placeholder="Interview feedback, follow-ups, and context." />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
