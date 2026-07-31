import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Loading, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { createJob, getJob, updateJob } from "../lib/api/hiring";
import { label } from "../lib/format";
import { JOB_STATUSES } from "../lib/options";
import { useToast } from "../toast";
import type { JobPayload, JobStatus } from "../types";

const emptyJob: JobPayload = {
  title: "",
  department: "",
  location: "",
  type: "",
  summary: "",
  description: "",
  responsibilities: [],
  requirements: [],
  applicationLink: null,
  status: "OPEN",
};

function lines(value: string): string[] {
  return value.split("\n").map((row) => row.trim()).filter(Boolean);
}

export function JobFormPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(jobId);
  const [form, setForm] = useState<JobPayload>(emptyJob);
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const toast = useToast();
  const cancelTo = isEdit ? `/hiring/jobs/${jobId}` : "/hiring?tab=jobs";

  useEffect(() => {
    if (jobId) {
      getJob(jobId)
        .then((job) => {
          setForm({
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            summary: job.summary,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            applicationLink: job.applicationLink,
            status: job.status,
          });
          setResponsibilities(job.responsibilities.join("\n"));
          setRequirements(job.requirements.join("\n"));
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }
  }, [jobId]);

  const title = useMemo(() => (isEdit ? "Edit job" : "New job"), [isEdit]);

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;

  function set<K extends keyof JobPayload>(key: K, value: JobPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        responsibilities: lines(responsibilities),
        requirements: lines(requirements),
      };
      const saved = isEdit
        ? await updateJob(Number(jobId), payload)
        : await createJob(payload);
      toast.success(isEdit ? "Job updated." : "Job created.");
      navigate(`/hiring/jobs/${saved.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={isEdit ? ["Hiring", form.title || "Job", "Edit"] : ["Hiring", "New job"]}
      title={title}
      description="Position, application, and publishing details."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Create job"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Overview" bordered={false}>
        <FormField label="Title"><Input value={form.title} onChange={(event) => set("title", event.target.value)} required /></FormField>
        <FormField label="Department"><Input value={form.department} onChange={(event) => set("department", event.target.value)} required /></FormField>
        <FormField label="Location"><Input value={form.location} onChange={(event) => set("location", event.target.value)} required /></FormField>
        <FormField label="Type"><Input value={form.type} onChange={(event) => set("type", event.target.value)} placeholder="Full Time" required /></FormField>
        <FormField label="Status"><Select value={form.status} onChange={(event) => set("status", event.target.value as JobStatus)}>{JOB_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select></FormField>
        <FormField label="Application link"><Input type="url" value={form.applicationLink ?? ""} onChange={(event) => set("applicationLink", event.target.value || null)} placeholder="https://" /></FormField>
        <FormField label="Summary" className="md:col-span-2"><Textarea value={form.summary} onChange={(event) => set("summary", event.target.value)} required /></FormField>
      </FormSection>
      <FormSection heading="Description" accent="tertiary">
        <FormField label="Description" className="md:col-span-2"><Textarea value={form.description} onChange={(event) => set("description", event.target.value)} required /></FormField>
      </FormSection>
      <FormSection heading="Responsibilities">
        <FormField label="Responsibilities" hint="Enter one responsibility per line." className="md:col-span-2"><Textarea value={responsibilities} onChange={(event) => setResponsibilities(event.target.value)} /></FormField>
      </FormSection>
      <FormSection heading="Requirements" accent="tertiary">
        <FormField label="Requirements" hint="Enter one requirement per line." className="md:col-span-2"><Textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} /></FormField>
      </FormSection>
    </FormPage>
  );
}
