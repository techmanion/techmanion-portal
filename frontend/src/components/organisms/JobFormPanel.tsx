import { Button, Input, Select, Textarea } from "../atoms";
import { FormField } from "../molecules/FormField";
import { label } from "../../lib/format";
import { JOB_STATUSES } from "../../lib/options";
import type { JobPayload, JobStatus } from "../../types";

export function JobFormPanel({
  form,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: JobPayload;
  editing: boolean;
  onChange: (form: JobPayload) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2" onSubmit={onSubmit}>
      <FormField label="Title">
        <Input
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Status">
        <Select
          value={form.status}
          onChange={(event) => onChange({ ...form, status: event.target.value as JobStatus })}
        >
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
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          required
        />
      </FormField>
      <div className="flex gap-2.5 md:col-span-2">
        <Button type="submit">{editing ? "Save changes" : "Create job"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
