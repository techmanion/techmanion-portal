import { Icon, IconButton } from "../atoms";
import { StatusChip } from "../atoms/Badge";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatDate } from "../../lib/format";
import type { Candidate } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function CandidatesTable({
  candidates,
  onConvert,
  onEdit,
  onDelete,
}: {
  candidates: Candidate[];
  onConvert: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
}) {
  return (
    <DataTable minWidth="1000px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Candidate</th>
          <th className="px-4 py-3 font-medium">Job</th>
          <th className="px-4 py-3 font-medium">Stage</th>
          <th className="px-4 py-3 font-medium">Interview date</th>
          <th className="w-32 px-4 py-3" />
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <td className="px-6">
              <EmployeeCell name={candidate.fullName} subtitle={candidate.email} />
            </td>
            <td className="px-4 text-sm text-on-surface">{candidate.jobTitle}</td>
            <td className="px-4">
              <StatusChip value={candidate.stage} />
            </td>
            <td className="px-4 text-sm text-on-surface">{formatDate(candidate.interviewDate)}</td>
            <td className="px-4">
              <div className="flex items-center justify-end gap-1">
                {candidate.stage !== "HIRED" && (
                  <IconButton
                    aria-label="Convert to employee"
                    title="Convert to employee"
                    size="sm"
                    onClick={() => onConvert(candidate)}
                  >
                    <Icon className="text-[16px]">person_add</Icon>
                  </IconButton>
                )}
                <IconButton aria-label="Edit candidate" size="sm" onClick={() => onEdit(candidate)}>
                  <Icon className="text-[16px]">edit</Icon>
                </IconButton>
                <IconButton
                  aria-label="Delete candidate"
                  size="sm"
                  onClick={() => onDelete(candidate)}
                >
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
