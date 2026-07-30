import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth";
import { Icon } from "../atoms/Icon";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "../../lib/nav";

function NavRow({
  to,
  icon,
  label,
}: {
  to: string;
  icon: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-l-full px-4 text-sm transition ${
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

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-x-0 bottom-0 top-16 z-30 bg-black/50 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`portal-sidebar fixed bottom-0 left-0 top-16 z-40 w-60 bg-background px-3 pt-2 transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1" onClick={onClose}>
          {NAV_ITEMS.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
          {user?.role === "ADMIN" && (
            <>
              <div className="mx-4 my-4 h-px bg-outline-variant/50" />
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavRow key={item.label} {...item} />
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
