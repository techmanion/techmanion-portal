import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../components/atoms";
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
const cancelTo = "/hiring?tab=candidates";

export function CandidateFormPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(candidateId);
  const [form, setForm] = useState<CandidatePayload>(emptyCandidate);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

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
      });
    }
  }, [candidateId]);

  const title = useMemo(() => (isEdit ? "Edit candidate" : "Add candidate"), [isEdit]);

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
      if (isEdit) {
        await updateCandidate(Number(candidateId), payload);
        toast.success("Candidate updated.");
      } else {
        await createCandidate(payload);
        toast.success("Candidate added.");
      }
      navigate(cancelTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={["Hiring", title]}
      title={title}
      description="Contact details, role, and pipeline stage."
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
            <option value="" disabled>
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
            onChange={(event) => set("stage", event.target.value as CandidateStage)}
          >
            {CANDIDATE_STAGES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Interview date">
          <Input
            type="date"
            value={form.interviewDate ?? ""}
            onChange={(event) => set("interviewDate", event.target.value)}
          />
        </FormField>
        <FormField label="Resume link" className="md:col-span-2">
          <Input value={form.resume ?? ""} onChange={(event) => set("resume", event.target.value)} />
        </FormField>
      </FormSection>

      <FormSection heading="Notes" accent="tertiary">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value)} />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
