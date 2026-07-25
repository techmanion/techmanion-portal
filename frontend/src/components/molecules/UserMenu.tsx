import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";

export function UserMenu({ onLogout }: { onLogout: () => void }) {
  return (
    <IconButton variant="filled" onClick={onLogout} title="Sign out" aria-label="Sign out">
      <Icon className="text-[18px]">person</Icon>
    </IconButton>
  );
}
