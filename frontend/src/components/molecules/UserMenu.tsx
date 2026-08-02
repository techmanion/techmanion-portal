import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../atoms/Avatar";
import { Icon } from "../atoms/Icon";
import { avatarSrc } from "../../lib/api/client";
import { useTheme } from "../../theme";
import type { User } from "../../types";

export function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition hover:bg-surface-container-high sm:pr-3"
      >
        <Avatar src={avatarSrc(user.avatarUrl)} alt={user.name} size="md" />
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-on-surface sm:block">
          {user.name}
        </span>
        <Icon className={`hidden text-[18px] text-on-surface-variant transition-transform sm:block ${open ? "rotate-180" : ""}`}>
          expand_more
        </Icon>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl bg-surface-container-high shadow-panel ring-1 ring-outline-variant/30"
        >
          <div className="p-1.5">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-on-surface hover:bg-surface-container-highest"
            >
              <Icon className="text-[18px] text-on-surface-variant">person</Icon>
              My profile
            </Link>
            {user.role === "EXECUTIVE" && (
              <>
                <Link
                  to="/organization"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-on-surface hover:bg-surface-container-highest"
                >
                  <Icon className="text-[18px] text-on-surface-variant">domain</Icon>
                  Organization
                </Link>
                <Link
                  to="/management"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-on-surface hover:bg-surface-container-highest"
                >
                  <Icon className="text-[18px] text-on-surface-variant">workspace_premium</Icon>
                  Management
                </Link>
              </>
            )}
          </div>
          <div className="border-t border-outline-variant/30 p-1.5">
            <div className="flex items-center justify-between rounded-xl px-2.5 py-2">
              <span className="flex items-center gap-3 text-sm text-on-surface">
                <Icon className="text-[18px] text-on-surface-variant">contrast</Icon>
                Appearance
              </span>
              <div role="group" aria-label="Theme" className="flex items-center gap-0.5 rounded-full bg-surface-container-highest p-0.5">
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  onClick={() => setTheme("dark")}
                  className={`grid size-7 place-items-center rounded-full transition ${
                    theme === "dark" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icon className="text-[16px]">dark_mode</Icon>
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "light"}
                  onClick={() => setTheme("light")}
                  className={`grid size-7 place-items-center rounded-full transition ${
                    theme === "light" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icon className="text-[16px]">light_mode</Icon>
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant/30 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-error hover:bg-error/10"
            >
              <Icon className="text-[18px]">logout</Icon>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
