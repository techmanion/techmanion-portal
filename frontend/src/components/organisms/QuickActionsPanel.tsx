import { Link } from "react-router-dom";
import { Icon } from "../atoms/Icon";

function QuickAction({ icon, labelText, to }: { icon: string; labelText: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3.5 text-left text-sm font-medium text-on-surface transition hover:bg-surface-bright"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="text-[20px]">{icon}</Icon>
      </span>
      {labelText}
    </Link>
  );
}

export function QuickActionsPanel() {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <QuickAction icon="person_add" labelText="Add Candidate" to="/hiring?action=add-candidate" />
      <QuickAction icon="group_add" labelText="Add Employee" to="/employees/new" />
      <QuickAction icon="add_task" labelText="Add Project" to="/projects?action=add-project" />
      <QuickAction icon="payments" labelText="Open Payroll" to="/payroll" />
    </div>
  );
}
