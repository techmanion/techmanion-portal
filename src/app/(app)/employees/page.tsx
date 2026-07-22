import Link from "next/link";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { EmployeeStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeFilters } from "./employee-filters";
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
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const department = typeof sp.department === "string" ? sp.department : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const hasFilters = Boolean(q || department || status);

  const where: Prisma.EmployeeWhereInput = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { cnic: { contains: q } },
    ];
  }
  if (department) where.departmentId = department;
  if (status) where.status = status as EmployeeStatus;

  const [employees, departments] = await Promise.all([
    db.employee.findMany({
      where,
      include: { designation: true, department: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        action={
          <Link href="/employees/new" className={cn(buttonVariants())}>
            Add employee
          </Link>
        }
      />

      <EmployeeFilters departments={departments} />

      <div className="rounded-lg border border-border bg-card">
        {employees.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">
            {hasFilters
              ? "No employees match these filters."
              : "No employees yet. Add your first employee to get started."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id} className="h-12">
                  <TableCell>
                    <Link
                      href={`/employees/${e.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {e.firstName} {e.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.designation.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.department.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {EMPLOYMENT_TYPE_LABELS[e.type] ?? e.type}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(e.joiningDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
