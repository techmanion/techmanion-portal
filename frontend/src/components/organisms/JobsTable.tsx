import { Icon, IconButton } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import type { Job } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function JobsTable({ jobs, onOpen, onEdit, onDelete }: { jobs: Job[]; onOpen: (job: Job) => void; onEdit: (job: Job) => void; onDelete: (job: Job) => void }) {
  return (
    <DataTable minWidth="1040px">
      <thead><TableHeadRow><th className="px-6 py-3 font-medium">Position</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th><th className="w-24 px-4 py-3" /></TableHeadRow></thead>
      <tbody className="divide-y divide-outline-variant/30">
        {jobs.map((job) => (
          <TableRow key={job.id} onClick={() => onOpen(job)}>
            <td className="px-6"><strong className="block text-sm font-medium text-on-surface">{job.title}</strong><span className="mt-1 block max-w-md truncate text-xs text-on-surface-variant">{job.summary}</span></td>
            <td className="px-4 text-sm text-on-surface">{job.department}</td>
            <td className="px-4 text-sm text-on-surface">{job.location}</td>
            <td className="px-4 text-sm text-on-surface">{job.type}</td>
            <td className="px-4"><StatusChip value={job.status} /></td>
            <td className="px-4"><div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}><IconButton aria-label={`Edit ${job.title}`} size="sm" onClick={() => onEdit(job)}><Icon className="text-[16px]">edit</Icon></IconButton><IconButton aria-label={`Delete ${job.title}`} size="sm" onClick={() => onDelete(job)}><Icon className="text-[16px]">delete</Icon></IconButton></div></td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
