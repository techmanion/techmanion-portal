import { Link } from "react-router-dom";
import { Avatar } from "../atoms/Avatar";
import { StatusChip } from "../atoms/Badge";
import { Icon } from "../atoms/Icon";
import { formatDate, label } from "../../lib/format";
import type { Employee } from "../../types";

export function ProfileHeader({ employee }: { employee: Employee }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar alt={employee.fullName} size="xl" />
          <span className="absolute bottom-0.5 right-0.5 size-4 rounded-full border-[3px] border-background bg-green-500" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title font-semibold tracking-tight text-on-surface">{employee.fullName}</h1>
            <StatusChip value={employee.status} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
            <span>{employee.designation?.name ?? "No designation"}</span>
            <span className="size-1 rounded-full bg-outline-variant" />
            <span>{label(employee.employeeType)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-on-surface-variant/80">
            <span className="flex items-center gap-1.5">
              <Icon className="text-[16px]">fingerprint</Icon>
              EMP-{String(employee.id).padStart(4, "0")}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon className="text-[16px]">mail</Icon>
              {employee.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon className="text-[16px]">calendar_today</Icon>
              Joined {formatDate(employee.joiningDate)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/employees/${employee.id}/edit`}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10"
        >
          <Icon className="text-[16px]">edit</Icon>
          Edit Employee
        </Link>
      </div>
    </div>
  );
}
