import { NavLink } from "react-router-dom";
import { Icon } from "../atoms/Icon";

const mainItems = [
  { to: "/employees", label: "Employees", icon: "group" },
  { to: "/projects", label: "Projects", icon: "list_alt" },
  { to: "/clients", label: "Clients", icon: "corporate_fare", disabled: true },
  { to: "/payroll", label: "Payroll", icon: "payments" },
];

const adminItems = [
  { to: "/settings", label: "Organization", icon: "hub" },
  { to: "/settings", label: "Tax Configuration", icon: "description" },
  { to: "/settings", label: "Audit History", icon: "history" },
];

function NavRow({
  to,
  icon,
  label,
  disabled = false,
}: {
  to: string;
  icon: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex h-10 items-center gap-3 rounded-full px-4 text-sm text-on-surface-variant/60">
        <Icon className="text-[20px]">{icon}</Icon>
        {label}
      </span>
    );
  }
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-full px-4 text-sm transition ${
          isActive
            ? "bg-secondary-container font-medium text-on-surface"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`
      }
    >
      <Icon className="text-[20px]">{icon}</Icon>
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="portal-sidebar fixed bottom-0 left-0 top-16 z-40 hidden w-60 bg-background px-3 pt-2 lg:block">
      <nav className="flex flex-col gap-1">
        <span className="mb-1.5 flex h-10 items-center gap-3 rounded-full px-4 text-sm text-on-surface-variant">
          <Icon className="text-[20px]">dashboard</Icon>
          Overview
        </span>
        {mainItems.map((item) => (
          <NavRow key={item.label} {...item} />
        ))}
        <div className="mx-4 my-4 h-px bg-outline-variant/50" />
        {adminItems.map((item) => (
          <NavRow key={item.label} {...item} />
        ))}
      </nav>
    </aside>
  );
}
