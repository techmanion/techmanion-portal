import type { Employee } from "../../types";

export function EmployeeAssignSelect({
  employees,
  onAssign,
  label = "Assign employee",
  resetAfterSelect = true,
  className = "",
}: {
  employees: Employee[];
  onAssign: (employeeId: number) => void;
  label?: string;
  resetAfterSelect?: boolean;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      defaultValue=""
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        if (event.target.value) onAssign(Number(event.target.value));
        if (resetAfterSelect) event.target.value = "";
      }}
      className={className}
    >
      <option value="">Assign member</option>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.fullName}
        </option>
      ))}
    </select>
  );
}
