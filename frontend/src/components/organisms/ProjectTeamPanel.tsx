import { Avatar, Icon, IconButton } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { EmployeeAssignSelect } from "../molecules/EmployeeAssignSelect";
import { EmptyState } from "../molecules/EmptyState";
import type { Employee, Project } from "../../types";

export function ProjectTeamPanel({
  project,
  unassignedEmployees,
  isAdmin,
  onAssign,
  onUnassign,
}: {
  project: Project;
  unassignedEmployees: Employee[];
  isAdmin: boolean;
  onAssign: (employeeId: number) => void;
  onUnassign: (assignmentId: number) => void;
}) {
  return (
    <section className="surface-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <SectionHeading>Team Members</SectionHeading>
        {isAdmin && (
          <EmployeeAssignSelect
            employees={unassignedEmployees}
            onAssign={onAssign}
            className="h-9 rounded-full bg-surface-container-high px-3.5 text-sm text-on-surface outline-none"
          />
        )}
      </div>
      {project.assignments.length ? (
        <ul className="divide-y divide-outline-variant/30">
          {project.assignments.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar alt={row.employeeName} size="sm" />
                <span className="text-sm font-medium text-on-surface">{row.employeeName}</span>
              </div>
              {isAdmin && (
                <IconButton
                  size="sm"
                  aria-label={`Remove ${row.employeeName}`}
                  onClick={() => onUnassign(row.id)}
                >
                  <Icon className="text-[18px]">close</Icon>
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No team members assigned yet.</EmptyState>
      )}
    </section>
  );
}
