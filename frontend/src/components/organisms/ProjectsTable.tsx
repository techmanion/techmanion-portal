import { Avatar } from "../atoms/Avatar";
import { StatusChip } from "../atoms/Badge";
import { EmployeeAssignSelect } from "../molecules/EmployeeAssignSelect";
import { formatDate } from "../../lib/format";
import type { Employee, Project } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function ProjectsTable({
  projects,
  employees,
  isAdmin,
  onRowClick,
  onAssign,
}: {
  projects: Project[];
  employees: Employee[];
  isAdmin: boolean;
  onRowClick: (project: Project) => void;
  onAssign: (projectId: number, employeeId: number) => void;
}) {
  return (
    <DataTable minWidth="980px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Project</th>
          <th className="px-4 py-3 font-medium">Client</th>
          <th className="px-4 py-3 font-medium">Team</th>
          <th className="px-4 py-3 font-medium">Timeline</th>
          <th className="px-4 py-3 font-medium">Status</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {projects.map((project) => (
          <TableRow key={project.id} onClick={() => onRowClick(project)}>
            <td className="px-6">
              <strong className="block text-sm font-medium text-on-surface">{project.name}</strong>
            </td>
            <td className="px-4 text-sm text-on-surface">{project.clientName}</td>
            <td className="px-4">
              <div className="flex items-center">
                <div className="flex -space-x-2.5">
                  {project.assignments.slice(0, 3).map((row) => (
                    <Avatar
                      key={row.id}
                      alt={row.employeeName}
                      size="sm"
                      ring
                      className="ring-2 ring-surface-container"
                    />
                  ))}
                </div>
                <span className="ml-3 text-xs text-on-surface-variant">
                  {project.assignments.length} members
                </span>
              </div>
              {isAdmin && (
                <EmployeeAssignSelect
                  label={`Assign employee to ${project.name}`}
                  employees={employees.filter(
                    (employee) => !project.assignments.some((item) => item.employeeId === employee.id),
                  )}
                  onAssign={(employeeId) => onAssign(project.id, employeeId)}
                  resetAfterSelect={false}
                  className="mt-1.5 max-w-36 bg-transparent text-xs text-primary outline-none"
                />
              )}
            </td>
            <td className="px-4 text-sm leading-6 text-on-surface">
              {formatDate(project.startDate)}
              <br />– {formatDate(project.endDate)}
            </td>
            <td className="px-4">
              <StatusChip value={project.status} />
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
