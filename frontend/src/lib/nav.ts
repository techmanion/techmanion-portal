export interface NavItem {
  to: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/overview", label: "Overview", icon: "dashboard" },
  { to: "/employees", label: "Employees", icon: "group" },
  { to: "/projects", label: "Projects", icon: "list_alt" },
  { to: "/clients", label: "Clients", icon: "corporate_fare", disabled: true },
  { to: "/payroll", label: "Payroll", icon: "payments" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/settings", label: "Organization", icon: "hub" },
  { to: "/settings", label: "Tax Configuration", icon: "description" },
  { to: "/settings", label: "Audit History", icon: "history" },
];
