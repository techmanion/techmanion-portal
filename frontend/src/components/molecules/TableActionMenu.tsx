import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";

export function TableActionMenu({
  onClick,
  label = "More actions",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <IconButton size="sm" aria-label={label} title={label} onClick={onClick}>
      <Icon className="text-[18px]">more_vert</Icon>
    </IconButton>
  );
}
