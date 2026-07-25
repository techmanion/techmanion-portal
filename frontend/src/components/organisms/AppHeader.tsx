import { useLocation } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Logo } from "../atoms/Logo";
import { UserMenu } from "../molecules/UserMenu";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "../../lib/nav";

const headerIcons = ["help", "settings", "notifications"];

function useSectionLabel() {
  const { pathname } = useLocation();
  const match = [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    .filter((item) => pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match ?? NAV_ITEMS[0];
}

export function AppHeader({ onLogout, onMenuClick }: { onLogout: () => void; onMenuClick?: () => void }) {
  const section = useSectionLabel();
  return (
    <header className="portal-header fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-5 bg-background/95 px-6 backdrop-blur-md">
      <IconButton className="lg:hidden" aria-label="Toggle navigation" onClick={onMenuClick}>
        <Icon>menu</Icon>
      </IconButton>
      <div className="shrink-0 lg:w-[218px]">
        <div className="lg:hidden">
          <Logo compact />
        </div>
        <div className="hidden lg:block">
          <Logo />
        </div>
      </div>
      <div className="hidden h-6 w-px bg-outline-variant/40 lg:block" />
      <div className="hidden items-center gap-2.5 text-on-surface lg:flex">
        <Icon className="text-[20px] text-on-surface-variant">{section.icon}</Icon>
        <span className="text-sm font-medium">{section.label}</span>
      </div>
      <div className="ml-auto flex items-center gap-1 text-on-surface-variant">
        {headerIcons.map((icon) => (
          <IconButton key={icon} aria-label={icon} className="hidden sm:grid">
            <Icon>{icon}</Icon>
          </IconButton>
        ))}
        <div className="ml-1">
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
