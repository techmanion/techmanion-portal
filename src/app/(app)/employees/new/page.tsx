import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { EmployeeForm } from "@/components/employee-form";
import { createEmployee } from "../actions";

export default async function NewEmployeePage() {
  await requireUser();

  const [departments, designations] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <PageHeader title="Add employee" />
      <EmployeeForm
        mode="create"
        action={createEmployee}
        departments={departments}
        designations={designations}
        cancelHref="/employees"
      />
    </div>
  );
}
