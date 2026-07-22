"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeFormState } from "@/app/(app)/employees/actions";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/labels";

type Option = { id: string; name: string };

export type EmployeeDefaults = {
  firstName?: string;
  lastName?: string;
  cnic?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  type?: string;
  designationId?: string;
  departmentId?: string;
  joiningDate?: string;
  probationEndDate?: string;
  confirmationDate?: string;
  accessLog?: string;
};

type Action = (
  state: EmployeeFormState,
  formData: FormData,
) => Promise<EmployeeFormState>;

const TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"] as const;

export function EmployeeForm({
  mode,
  action,
  departments,
  designations,
  defaults = {},
  cancelHref,
}: {
  mode: "create" | "edit";
  action: Action;
  departments: Option[];
  designations: Option[];
  defaults?: EmployeeDefaults;
  cancelHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState(defaults.type ?? "");
  const [departmentId, setDepartmentId] = useState(defaults.departmentId ?? "");
  const [designationId, setDesignationId] = useState(
    defaults.designationId ?? "",
  );

  const err = (name: string) => state?.fieldErrors?.[name];

  return (
    <form action={formAction} className="max-w-[560px] space-y-8">
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Section title="Personal">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" error={err("firstName")}>
            <Input name="firstName" defaultValue={defaults.firstName} required />
          </Field>
          <Field label="Last name" error={err("lastName")}>
            <Input name="lastName" defaultValue={defaults.lastName} required />
          </Field>
        </div>
        <Field label="CNIC" error={err("cnic")}>
          <Input name="cnic" defaultValue={defaults.cnic} required />
        </Field>
        <Field label="Date of birth" error={err("dateOfBirth")}>
          <Input
            type="date"
            name="dateOfBirth"
            defaultValue={defaults.dateOfBirth}
            required
          />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Email" error={err("email")}>
          <Input type="email" name="email" defaultValue={defaults.email} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" error={err("phone")}>
            <Input name="phone" defaultValue={defaults.phone} />
          </Field>
          <Field label="Address" error={err("address")}>
            <Input name="address" defaultValue={defaults.address} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Emergency contact name" error={err("emergencyContactName")}>
            <Input
              name="emergencyContactName"
              defaultValue={defaults.emergencyContactName}
            />
          </Field>
          <Field label="Emergency contact phone" error={err("emergencyContactPhone")}>
            <Input
              name="emergencyContactPhone"
              defaultValue={defaults.emergencyContactPhone}
            />
          </Field>
        </div>
      </Section>

      <Section title="Employment">
        <Field label="Employment type" error={err("type")}>
          <input type="hidden" name="type" value={type} />
          <Select value={type} onValueChange={(v) => setType(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EMPLOYMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department" error={err("departmentId")}>
            <input type="hidden" name="departmentId" value={departmentId} />
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Designation" error={err("designationId")}>
            <input type="hidden" name="designationId" value={designationId} />
            <Select value={designationId} onValueChange={(v) => setDesignationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Dates">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Joining date" error={err("joiningDate")}>
            <Input
              type="date"
              name="joiningDate"
              defaultValue={defaults.joiningDate}
              required
            />
          </Field>
          <Field label="Probation end" error={err("probationEndDate")}>
            <Input
              type="date"
              name="probationEndDate"
              defaultValue={defaults.probationEndDate}
            />
          </Field>
          <Field label="Confirmation" error={err("confirmationDate")}>
            <Input
              type="date"
              name="confirmationDate"
              defaultValue={defaults.confirmationDate}
            />
          </Field>
        </div>
      </Section>

      {mode === "create" ? (
        <Section title="Compensation">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starting salary (monthly)" error={err("startingSalary")}>
              <input type="hidden" name="currency" value="PKR" />
              <Input
                type="number"
                name="startingSalary"
                min="0"
                step="0.01"
                placeholder="e.g. 150000"
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional. Recorded as the hire salary (PKR). Further revisions are
            managed on the Compensation tab.
          </p>
        </Section>
      ) : null}

      <Section title="Access notes">
        <Field label="Access log" error={err("accessLog")}>
          <Input
            name="accessLog"
            defaultValue={defaults.accessLog}
            placeholder="e.g. company email / Trello issued"
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Add employee"
              : "Save changes"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[16px] font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
