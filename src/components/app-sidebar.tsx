"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Banknote, FolderKanban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/(app)/actions";

const NAV = [
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/payroll", label: "Payroll", icon: Banknote },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();

  return (
    // Fixed 240px sidebar — design-doc §2.3.
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center px-6 text-[16px] font-medium text-foreground">
        Techmanion
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary/10 font-medium text-sidebar-primary"
                  : "text-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon
                className="size-5 shrink-0"
                strokeWidth={active ? 2 : 1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="px-3 py-2">
          <div className="truncate text-sm font-medium text-foreground">
            {user.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{user.role}</div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="h-10 w-full rounded-md px-3 text-left text-sm text-foreground transition-colors hover:bg-sidebar-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
