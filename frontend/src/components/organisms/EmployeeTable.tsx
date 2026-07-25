import { Checkbox } from "../atoms/Checkbox";
import { StatusChip } from "../atoms/Badge";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatDate, label } from "../../lib/format";
import type { Employee } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function EmployeeTable({
  employees,
  avatars,
  onRowClick,
}: {
  employees: Employee[];
  avatars: string[];
  onRowClick: (employee: Employee) => void;
}) {
  return (
    <DataTable minWidth="960px">
      <thead>
        <TableHeadRow>
          <th className="w-14 px-6 py-3">
            <Checkbox />
          </th>
          <th className="px-3 py-3 font-medium">Employee</th>
          <th className="px-4 py-3 font-medium">Designation</th>
          <th className="px-4 py-3 font-medium">Department</th>
          <th className="px-4 py-3 font-medium">Type</th>
          <th className="px-4 py-3 font-medium">Joined date</th>
          <th className="px-5 py-3 font-medium">Status</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/20">
        {employees.map((employee, index) => (
          <TableRow key={employee.id} onClick={() => onRowClick(employee)}>
            <td className="px-6">
              <Checkbox onClick={(event) => event.stopPropagation()} />
            </td>
            <td className="px-3">
              <EmployeeCell name={employee.fullName} subtitle={employee.email} avatarSrc={avatars[index % avatars.length]} />
            </td>
            <td className="px-4 text-sm text-on-surface">{employee.designation?.name ?? "—"}</td>
            <td className="px-4 text-sm text-on-surface">{employee.department?.name ?? "—"}</td>
            <td className="px-4">
              <span className="rounded-lg bg-surface-container-highest px-2.5 py-1 text-xs text-on-surface-variant">
                {label(employee.employeeType)}
              </span>
            </td>
            <td className="px-4 text-sm text-on-surface">{formatDate(employee.joiningDate)}</td>
            <td className="px-5">
              <StatusChip value={employee.status} />
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
