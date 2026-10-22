import { Select, StatusChip } from "../atoms";
import { EmployeeCell } from "../molecules/EmployeeCell";
import { formatDateTime, label } from "../../lib/format";
import { LEAD_STATUSES } from "../../lib/options";
import type { Lead, LeadStatus } from "../../types";
import { DataTable, TableHeadRow, TableRow } from "./DataTable";

export function LeadsTable({
  leads,
  onStatusChange,
}: {
  leads: Lead[];
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  return (
    <DataTable minWidth="1120px">
      <thead>
        <TableHeadRow>
          <th className="px-6 py-3 font-medium">Contact</th>
          <th className="px-4 py-3 font-medium">Company</th>
          <th className="px-4 py-3 font-medium">Audience</th>
          <th className="px-4 py-3 font-medium">Goal</th>
          <th className="px-4 py-3 font-medium">Received</th>
          <th className="w-44 px-4 py-3 font-medium">Status</th>
        </TableHeadRow>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <td className="px-6">
              <EmployeeCell name={lead.name} subtitle={lead.email} />
            </td>
            <td className="px-4 text-sm text-on-surface">{lead.company || "—"}</td>
            <td className="px-4">
              <StatusChip value={lead.audience} />
            </td>
            <td className="max-w-72 truncate px-4 text-sm text-on-surface-variant">
              {lead.goal || "—"}
            </td>
            <td className="px-4 text-sm text-on-surface-variant">
              {formatDateTime(lead.createdAt)}
            </td>
            <td className="px-4">
              <Select
                aria-label={`Status for ${lead.name}`}
                value={lead.status}
                onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}
                className="!h-9 w-full"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {label(status)}
                  </option>
                ))}
              </Select>
            </td>
          </TableRow>
        ))}
      </tbody>
    </DataTable>
  );
}
