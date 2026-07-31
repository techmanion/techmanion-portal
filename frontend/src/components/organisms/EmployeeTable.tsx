import { StatusChip } from "../atoms/Badge";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatDate, label } from "../../lib/format";
import type { Employee } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function EmployeeTable({
  employees,
  onRowClick,
}: {
  employees: Employee[];
  onRowClick: (employee: Employee) => void;
}) {
  return (
    <DataTable minWidth="960px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Employee</th>
          <th className="px-4 py-3 font-medium">Designation</th>
          <th className="px-4 py-3 font-medium">Employment type</th>
          <th className="px-4 py-3 font-medium">Joining date</th>
          <th className="px-5 py-3 font-medium">Status</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/20">
        {employees.map((employee) => (
          <TableRow key={employee.id} onClick={() => onRowClick(employee)}>
            <td className="px-6">
              <EmployeeCell name={employee.fullName} subtitle={employee.email} />
            </td>
            <td className="px-4 text-sm text-on-surface">{employee.designation?.name ?? "—"}</td>
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
