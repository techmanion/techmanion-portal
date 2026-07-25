import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Logo } from "../atoms/Logo";
import { UserMenu } from "../molecules/UserMenu";

const headerIcons = ["help", "settings", "notifications"];

export function AppHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="portal-header fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-5 bg-background/95 px-6 backdrop-blur-md">
      <IconButton className="lg:hidden" aria-label="Toggle navigation">
        <Icon>menu</Icon>
      </IconButton>
      <div className="w-[218px] shrink-0">
        <Logo />
      </div>
      <div className="mx-auto flex h-10 w-full max-w-[720px] items-center rounded-full bg-surface-container-high px-4 focus-within:bg-surface-container-highest">
        <Icon className="mr-3 text-[20px] text-on-surface-variant">search</Icon>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          placeholder="Search employees, projects, clients..."
        />
        <Icon className="text-[18px] text-on-surface-variant">tune</Icon>
      </div>
      <div className="ml-auto flex items-center gap-1 text-on-surface-variant">
        {headerIcons.map((icon) => (
          <IconButton key={icon} aria-label={icon}>
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
