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
  { to: "/finance", label: "Finance", icon: "payments" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/organization", label: "Organization", icon: "domain" },
  { to: "/administration", label: "Administration", icon: "hub" },
];
