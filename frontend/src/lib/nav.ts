export interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/home", label: "Home", icon: "dashboard" },
  { to: "/hiring", label: "Hiring", icon: "person_search" },
  { to: "/employees", label: "Employees", icon: "group" },
  { to: "/projects", label: "Projects", icon: "list_alt" },
  { to: "/payroll", label: "Payroll", icon: "payments" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/team", label: "Team Members", icon: "manage_accounts" },
  { to: "/settings", label: "Organization", icon: "hub" },
];
