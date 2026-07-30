import { Button, Input, Select, Textarea } from "../atoms";
import { FormField } from "../molecules/FormField";
import { label } from "../../lib/format";
import { CANDIDATE_STAGES } from "../../lib/options";
import type { CandidatePayload, CandidateStage, Job } from "../../types";

export function CandidateFormPanel({
  form,
  jobs,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: CandidatePayload;
  jobs: Job[];
  editing: boolean;
  onChange: (form: CandidatePayload) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
      onSubmit={onSubmit}
    >
      <FormField label="Full name">
        <Input
          value={form.fullName}
          onChange={(event) => onChange({ ...form, fullName: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Email">
        <Input
          type="email"
          value={form.email}
          onChange={(event) => onChange({ ...form, email: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Phone">
        <Input
          value={form.phone ?? ""}
          onChange={(event) => onChange({ ...form, phone: event.target.value })}
        />
      </FormField>
      <FormField label="Job">
        <Select
          value={form.jobId || ""}
          onChange={(event) => onChange({ ...form, jobId: Number(event.target.value) })}
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
          onChange={(event) => onChange({ ...form, stage: event.target.value as CandidateStage })}
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
          onChange={(event) => onChange({ ...form, interviewDate: event.target.value })}
        />
      </FormField>
      <FormField label="Resume link">
        <Input
          value={form.resume ?? ""}
          onChange={(event) => onChange({ ...form, resume: event.target.value })}
        />
      </FormField>
      <FormField label="Notes" className="md:col-span-2 xl:col-span-3">
        <Textarea
          value={form.notes ?? ""}
          onChange={(event) => onChange({ ...form, notes: event.target.value })}
        />
      </FormField>
      <div className="flex gap-2.5 md:col-span-2 xl:col-span-3">
        <Button type="submit">{editing ? "Save changes" : "Add candidate"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
