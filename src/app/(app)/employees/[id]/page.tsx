import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeTabs } from "./employee-tabs";
import { StatusMenu } from "./status-menu";
import {
  EMPLOYMENT_TYPE_LABELS,
  SALARY_REASON_LABELS,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      designation: true,
      department: true,
      salaryRevisions: { orderBy: { effectiveDate: "desc" } },
    },
  });
  if (!employee) notFound();

  const currentSalary = employee.salaryRevisions[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-medium leading-tight text-foreground">
            {employee.firstName} {employee.lastName}
          </h1>
          <StatusBadge status={employee.status} />
        </div>
        <div className="flex items-center gap-3">
          <StatusMenu id={employee.id} current={employee.status} />
          <Link
            href={`/employees/${employee.id}/edit`}
            className={cn(buttonVariants())}
          >
            Edit
          </Link>
        </div>
      </div>

      <EmployeeTabs
        profile={
          <Card>
            <DescGrid>
              <Desc label="First name" value={employee.firstName} />
              <Desc label="Last name" value={employee.lastName} />
              <Desc label="CNIC" value={employee.cnic} />
              <Desc label="Date of birth" value={formatDate(employee.dateOfBirth)} />
              <Desc label="Email" value={employee.email} />
              <Desc label="Phone" value={employee.phone} />
              <Desc label="Address" value={employee.address} />
              <Desc
                label="Emergency contact"
                value={
                  employee.emergencyContactName || employee.emergencyContactPhone
                    ? `${employee.emergencyContactName ?? ""} ${employee.emergencyContactPhone ? `(${employee.emergencyContactPhone})` : ""}`.trim()
                    : null
                }
              />
              <Desc
                label="Employment type"
                value={EMPLOYMENT_TYPE_LABELS[employee.type] ?? employee.type}
              />
              <Desc label="Department" value={employee.department.name} />
              <Desc label="Designation" value={employee.designation.name} />
              <Desc label="Joining date" value={formatDate(employee.joiningDate)} />
              <Desc
                label="Probation end"
                value={formatDate(employee.probationEndDate)}
              />
              <Desc
                label="Confirmation"
                value={formatDate(employee.confirmationDate)}
              />
              <Desc label="Access log" value={employee.accessLog} />
            </DescGrid>
          </Card>
        }
        compensation={
          <Card>
            <div className="mb-4">
              <div className="text-xs text-muted-foreground">Current salary</div>
              <div className="text-[22px] font-medium tabular-nums text-foreground">
                {currentSalary
                  ? formatMoney(currentSalary.baseAmount, currentSalary.currency)
                  : "—"}
              </div>
            </div>
            {employee.salaryRevisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No salary recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.salaryRevisions.map((r) => (
                    <TableRow key={r.id} className="h-12">
                      <TableCell>{formatDate(r.effectiveDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {SALARY_REASON_LABELS[r.reason] ?? r.reason}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.baseAmount, r.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        }
        documents={<Stub text="Document uploads arrive in a later slice." />}
        payroll={<Stub text="Payroll history appears once payroll runs exist." />}
        projects={<Stub text="Project assignments arrive with the Projects module." />}
      />
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-6">
      {children}
    </div>
  );
}

function DescGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-8 gap-y-5">{children}</dl>;
}

function Desc({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function Stub({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-8">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
