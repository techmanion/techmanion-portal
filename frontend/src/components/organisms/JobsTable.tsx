import { Icon, IconButton } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import type { Job } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function JobsTable({
  jobs,
  onEdit,
  onDelete,
}: {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  return (
    <DataTable minWidth="800px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Title</th>
          <th className="px-4 py-3 font-medium">Description</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="w-24 px-4 py-3" />
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <td className="px-6 text-sm font-medium text-on-surface">{job.title}</td>
            <td className="max-w-md truncate px-4 text-sm text-on-surface-variant">
              {job.description}
            </td>
            <td className="px-4">
              <StatusChip value={job.status} />
            </td>
            <td className="px-4">
              <div className="flex items-center justify-end gap-1">
                <IconButton aria-label="Edit job" size="sm" onClick={() => onEdit(job)}>
                  <Icon className="text-[16px]">edit</Icon>
                </IconButton>
                <IconButton aria-label="Delete job" size="sm" onClick={() => onDelete(job)}>
                  <Icon className="text-[16px]">delete</Icon>
                </IconButton>
              </div>
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
