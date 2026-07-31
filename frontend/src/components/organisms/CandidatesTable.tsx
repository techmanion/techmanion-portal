import { Icon, IconButton, Select } from "../atoms";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatDate, label } from "../../lib/format";
import { CANDIDATE_STAGES } from "../../lib/options";
import type { Candidate, CandidateStage } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function CandidatesTable({ candidates, onOpen, onStageChange, onConvert, onEdit, onDelete }: { candidates: Candidate[]; onOpen: (candidate: Candidate) => void; onStageChange: (candidate: Candidate, stage: CandidateStage) => void; onConvert: (candidate: Candidate) => void; onEdit: (candidate: Candidate) => void; onDelete: (candidate: Candidate) => void }) {
  return (
    <DataTable minWidth="1120px">
      <thead><TableHeadRow><th className="px-6 py-3 font-medium">Candidate</th><th className="px-4 py-3 font-medium">Job</th><th className="px-4 py-3 font-medium">Stage</th><th className="px-4 py-3 font-medium">Interview</th><th className="px-4 py-3 font-medium">Notes</th><th className="w-32 px-4 py-3" /></TableHeadRow></thead>
      <tbody className="divide-y divide-outline-variant/30">
        {candidates.map((candidate) => (
          <TableRow key={candidate.id} onClick={() => onOpen(candidate)}>
            <td className="px-6"><EmployeeCell name={candidate.fullName} subtitle={candidate.email} /></td>
            <td className="px-4 text-sm text-on-surface">{candidate.jobTitle}</td>
            <td className="px-4" onClick={(event) => event.stopPropagation()}><Select aria-label={`Stage for ${candidate.fullName}`} value={candidate.stage} disabled={candidate.stage === "HIRED"} onChange={(event) => onStageChange(candidate, event.target.value as CandidateStage)} className="!h-9 w-40">{CANDIDATE_STAGES.filter((stage) => stage !== "HIRED" || candidate.stage === "HIRED").map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</Select></td>
            <td className="px-4"><span className={`text-sm ${candidate.interviewDate ? "font-medium text-on-surface" : "text-on-surface-variant"}`}>{candidate.interviewDate ? formatDate(candidate.interviewDate) : "Not scheduled"}</span></td>
            <td className="max-w-56 truncate px-4 text-sm text-on-surface-variant">{candidate.notes || "—"}</td>
            <td className="px-4"><div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>{candidate.stage !== "HIRED" && <IconButton aria-label={`Convert ${candidate.fullName} to employee`} title="Convert to employee" size="sm" onClick={() => onConvert(candidate)}><Icon className="text-[16px]">person_add</Icon></IconButton>}<IconButton aria-label={`Edit ${candidate.fullName}`} size="sm" onClick={() => onEdit(candidate)}><Icon className="text-[16px]">edit</Icon></IconButton><IconButton aria-label={`Delete ${candidate.fullName}`} size="sm" onClick={() => onDelete(candidate)}><Icon className="text-[16px]">delete</Icon></IconButton></div></td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
