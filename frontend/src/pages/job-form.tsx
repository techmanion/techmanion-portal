import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { createJob, getJob, updateJob } from "../lib/api/hiring";
import { label } from "../lib/format";
import { JOB_STATUSES } from "../lib/options";
import { useToast } from "../toast";
import type { JobPayload, JobStatus } from "../types";

const emptyJob: JobPayload = { title: "", description: "", status: "OPEN" };
const cancelTo = "/hiring?tab=jobs";

export function JobFormPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(jobId);
  const [form, setForm] = useState<JobPayload>(emptyJob);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (jobId) {
      getJob(jobId).then((job) => setForm({ title: job.title, description: job.description, status: job.status }));
    }
  }, [jobId]);

  const title = useMemo(() => (isEdit ? "Edit job" : "New job"), [isEdit]);

  function set<K extends keyof JobPayload>(key: K, value: JobPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await updateJob(Number(jobId), form);
        toast.success("Job updated.");
      } else {
        await createJob(form);
        toast.success("Job created.");
      }
      navigate(cancelTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={["Hiring", title]}
      title={title}
      description="Role details and status."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Create job"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Job details" bordered={false}>
        <FormField label="Title">
          <Input value={form.title} onChange={(event) => set("title", event.target.value)} required />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={(event) => set("status", event.target.value as JobStatus)}>
            {JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Description" className="md:col-span-2">
          <Textarea
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            required
          />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
