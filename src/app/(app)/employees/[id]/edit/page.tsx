import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { EmployeeForm } from "@/components/employee-form";
import { updateEmployee } from "../../actions";
import { toDateInputValue } from "@/lib/format";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [employee, departments, designations] = await Promise.all([
    db.employee.findUnique({ where: { id } }),
    db.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.designation.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${employee.firstName} ${employee.lastName}`} />
      <EmployeeForm
        mode="edit"
        action={updateEmployee.bind(null, id)}
        departments={departments}
        designations={designations}
        cancelHref={`/employees/${id}`}
        defaults={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          cnic: employee.cnic,
          dateOfBirth: toDateInputValue(employee.dateOfBirth),
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          address: employee.address ?? "",
          emergencyContactName: employee.emergencyContactName ?? "",
          emergencyContactPhone: employee.emergencyContactPhone ?? "",
          type: employee.type,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          joiningDate: toDateInputValue(employee.joiningDate),
          probationEndDate: toDateInputValue(employee.probationEndDate),
          confirmationDate: toDateInputValue(employee.confirmationDate),
          accessLog: employee.accessLog ?? "",
        }}
      />
    </div>
  );
}
