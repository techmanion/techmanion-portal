import { Button, Input, Select, Textarea } from "../atoms";
import { FormField } from "../molecules/FormField";
import { label } from "../../lib/format";
import { PROJECT_STATUSES } from "../../lib/options";
import type { ProjectPayload, ProjectStatus } from "../../types";

export function ProjectFormPanel({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Save project",
  className = "mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3",
  fullWidthClassName = "md:col-span-2 xl:col-span-3",
}: {
  form: ProjectPayload;
  onChange: (form: ProjectPayload) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
  className?: string;
  fullWidthClassName?: string;
}) {
  return (
    <form className={`surface-panel ${className}`} onSubmit={onSubmit}>
      <FormField label="Project name">
        <Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
      </FormField>
      <FormField label="Client">
        <Input
          value={form.clientName}
          onChange={(event) => onChange({ ...form, clientName: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Status">
        <Select
          value={form.status}
          onChange={(event) => onChange({ ...form, status: event.target.value as ProjectStatus })}
        >
          {PROJECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Start date">
        <Input
          type="date"
          value={form.startDate}
          onChange={(event) => onChange({ ...form, startDate: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Target end date">
        <Input
          type="date"
          value={form.endDate ?? ""}
          onChange={(event) => onChange({ ...form, endDate: event.target.value })}
        />
      </FormField>
      <FormField label="Notes" className={fullWidthClassName}>
        <Textarea
          value={form.notes ?? ""}
          onChange={(event) => onChange({ ...form, notes: event.target.value })}
        />
      </FormField>
      <div className={`flex gap-2.5 ${fullWidthClassName}`}>
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
