"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { employeeSchema } from "@/lib/validation/employee";
import { toMinorUnits } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";
import type { EmployeeStatus } from "@/generated/prisma/enums";

export type EmployeeFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

function coreData(d: z.infer<typeof employeeSchema>) {
  return {
    firstName: d.firstName,
    lastName: d.lastName,
    cnic: d.cnic,
    dateOfBirth: d.dateOfBirth,
    email: d.email ?? null,
    phone: d.phone ?? null,
    address: d.address ?? null,
    emergencyContactName: d.emergencyContactName ?? null,
    emergencyContactPhone: d.emergencyContactPhone ?? null,
    type: d.type,
    designationId: d.designationId,
    departmentId: d.departmentId,
    joiningDate: d.joiningDate,
    probationEndDate: d.probationEndDate ?? null,
    confirmationDate: d.confirmationDate ?? null,
    accessLog: d.accessLog ?? null,
  };
}

export async function createEmployee(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const user = await requireUser();

  const parsed = employeeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  let employeeId: string;
  try {
    const employee = await db.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: { ...coreData(d), status: "ACTIVE", compType: "FIXED" },
      });
      if (d.startingSalary) {
        await tx.salaryRevision.create({
          data: {
            employeeId: emp.id,
            baseAmount: toMinorUnits(d.startingSalary),
            currency: d.currency,
            effectiveDate: d.joiningDate,
            reason: "HIRE",
            createdByUserId: user.id,
          },
        });
      }
      return emp;
    });
    employeeId = employee.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "An employee with this CNIC already exists." };
    }
    throw e;
  }

  revalidatePath("/employees");
  redirect(`/employees/${employeeId}`);
}

export async function updateEmployee(
  id: string,
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireUser();

  const parsed = employeeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  try {
    await db.employee.update({ where: { id }, data: coreData(d) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "An employee with this CNIC already exists." };
    }
    throw e;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

/**
 * Change employment status. Employees are never hard-deleted (data-model.md §7);
 * status changes to RESIGNED/TERMINATED are recorded in the audit log.
 */
export async function setEmployeeStatus(id: string, status: EmployeeStatus) {
  const user = await requireUser();

  const before = await db.employee.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!before || before.status === status) return;

  await db.$transaction([
    db.employee.update({ where: { id }, data: { status } }),
    db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "EMPLOYEE_STATUS_CHANGE",
        entityType: "Employee",
        entityId: id,
        before: { status: before.status },
        after: { status },
      },
    }),
  ]);

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
}
