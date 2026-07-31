import { Button, Icon, Input, Select, Textarea } from "../atoms";
import { FormField, FormSection, MoneyInput } from "../molecules";
import { label } from "../../lib/format";
import { MILESTONE_STATUSES, PROJECT_STATUSES, PROJECT_TYPES } from "../../lib/options";
import type { MilestoneStatus, ProjectPayload, ProjectStatus, ProjectType } from "../../types";

export function ProjectFormFields({
  value,
  onChange,
}: {
  value: ProjectPayload;
  onChange: (value: ProjectPayload) => void;
}) {
  function set<K extends keyof ProjectPayload>(key: K, fieldValue: ProjectPayload[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  function updateMilestone(index: number, patch: Partial<ProjectPayload["milestones"][number]>) {
    set(
      "milestones",
      value.milestones.map((milestone, rowIndex) =>
        rowIndex === index ? { ...milestone, ...patch } : milestone,
      ),
    );
  }

  return (
    <>
      <FormSection heading="Project details" bordered={false}>
        <FormField label="Project name">
          <Input value={value.name} onChange={(event) => set("name", event.target.value)} required />
        </FormField>
        <FormField label="Client">
          <Input value={value.clientName} onChange={(event) => set("clientName", event.target.value)} required />
        </FormField>
        <FormField label="Type">
          <Select value={value.projectType} onChange={(event) => set("projectType", event.target.value as ProjectType)}>
            {PROJECT_TYPES.map((projectType) => (
              <option key={projectType} value={projectType}>{label(projectType)}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={value.status} onChange={(event) => set("status", event.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>{label(status)}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Start date">
          <Input type="date" value={value.startDate} onChange={(event) => set("startDate", event.target.value)} required />
        </FormField>
        <FormField label="End date" hint="Optional">
          <Input type="date" value={value.endDate ?? ""} onChange={(event) => set("endDate", event.target.value || null)} />
        </FormField>
      </FormSection>

      {value.projectType === "MONTHLY_RECURRING" && (
        <FormSection heading="Monthly recurring" accent="tertiary">
          <FormField label="Monthly amount">
            <MoneyInput value={value.monthlyAmount ?? 0} onChange={(amount) => set("monthlyAmount", amount)} required />
          </FormField>
          <FormField label="Billing day" hint="1–31; shorter months use their final day">
            <Input type="number" min="1" max="31" value={value.billingDay ?? ""} onChange={(event) => set("billingDay", Number(event.target.value))} required />
          </FormField>
          <label className="flex items-center gap-3 text-sm text-on-surface md:col-span-2">
            <input type="checkbox" checked={Boolean(value.autoRenew)} onChange={(event) => set("autoRenew", event.target.checked)} className="size-4 accent-primary" />
            Auto renew
          </label>
        </FormSection>
      )}

      {value.projectType === "FIXED" && (
        <>
          <FormSection heading="Fixed contract" accent="tertiary">
            <FormField label="Contract value">
              <MoneyInput value={value.contractValue ?? 0} onChange={(amount) => set("contractValue", amount)} required />
            </FormField>
          </FormSection>
          <FormSection heading="Milestones">
            <div className="space-y-4 md:col-span-2">
              {value.milestones.map((milestone, index) => (
                <div key={index} className="grid gap-4 rounded-xl bg-surface-container-high/50 p-4 md:grid-cols-2">
                  <FormField label="Name">
                    <Input value={milestone.name} onChange={(event) => updateMilestone(index, { name: event.target.value })} required />
                  </FormField>
                  <FormField label="Amount">
                    <MoneyInput value={milestone.amount} onChange={(amount) => updateMilestone(index, { amount })} required />
                  </FormField>
                  <FormField label="Due date">
                    <Input type="date" value={milestone.dueDate} onChange={(event) => updateMilestone(index, { dueDate: event.target.value })} required />
                  </FormField>
                  <FormField label="Status">
                    <Select value={milestone.status} onChange={(event) => updateMilestone(index, { status: event.target.value as MilestoneStatus })}>
                      {MILESTONE_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Paid date" hint="Optional">
                    <Input type="date" value={milestone.paidDate ?? ""} onChange={(event) => updateMilestone(index, { paidDate: event.target.value || null })} />
                  </FormField>
                  <div className="flex items-end justify-end">
                    <Button type="button" variant="ghost" onClick={() => set("milestones", value.milestones.filter((_, rowIndex) => rowIndex !== index))}>
                      <Icon className="text-[16px]">delete</Icon>Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => set("milestones", [...value.milestones, { name: "", amount: 0, dueDate: "", status: "PENDING", paidDate: null }])}>
                <Icon className="text-[16px]">add</Icon>Add milestone
              </Button>
            </div>
          </FormSection>
        </>
      )}

      {value.projectType === "HOURLY" && (
        <FormSection heading="Hourly billing" accent="tertiary">
          <FormField label="Hourly rate">
            <MoneyInput value={value.hourlyRate ?? 0} onChange={(amount) => set("hourlyRate", amount)} required />
          </FormField>
          <FormField label="Estimated hours" hint="Optional">
            <Input type="number" min="0" step="0.25" value={value.estimatedHours ?? ""} onChange={(event) => set("estimatedHours", event.target.value ? Number(event.target.value) : null)} />
          </FormField>
          <FormField label="Logged hours">
            <Input type="number" min="0" step="0.25" value={value.loggedHours ?? 0} onChange={(event) => set("loggedHours", Number(event.target.value))} required />
          </FormField>
        </FormSection>
      )}

      <FormSection heading="Notes">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={value.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
        </FormField>
      </FormSection>
    </>
  );
}
