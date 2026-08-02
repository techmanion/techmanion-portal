import { StatusChip } from "../atoms/Badge";
import { formatDate, formatMoney } from "../../lib/format";
import type { Project } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

function projectValue(project: Project) {
  if (project.projectType === "MONTHLY_RECURRING") {
    return `${formatMoney(project.monthlyAmount ?? 0)} / month`;
  }
  if (project.projectType === "FIXED") return formatMoney(project.contractValue ?? 0);
  return `${formatMoney(project.hourlyRate ?? 0)} / hour`;
}

export function ProjectsTable({
  projects,
  onRowClick,
}: {
  projects: Project[];
  onRowClick: (project: Project) => void;
}) {
  return (
    <DataTable minWidth="880px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Project</th>
          <th className="px-4 py-3 font-medium">Client</th>
          <th className="px-4 py-3 font-medium">Value</th>
          <th className="px-4 py-3 font-medium">Deadline</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Payment</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {projects.map((project) => (
          <TableRow key={project.id} onClick={() => onRowClick(project)}>
            <td className="px-6">
              <strong className="block text-sm font-medium text-on-surface">{project.name}</strong>
            </td>
            <td className="px-4 text-sm text-on-surface">{project.clientName}</td>
            <td className="px-4 text-sm text-on-surface">{projectValue(project)}</td>
            <td className="px-4 text-sm text-on-surface">
              {project.endDate ? formatDate(project.endDate) : "—"}
            </td>
            <td className="px-4"><StatusChip value={project.status} /></td>
            <td className="px-4">
              <StatusChip value={project.paymentStatus} />
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
