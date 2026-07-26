import { Avatar, type AvatarSize } from "../atoms/Avatar";

export function EmployeeCell({
  name,
  subtitle,
  avatarSrc,
  avatarSize = "md",
}: {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  avatarSize?: AvatarSize;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={avatarSrc} alt={name} size={avatarSize} ring />
      <div className="min-w-0">
        <strong className="block truncate text-sm font-medium text-on-surface">{name}</strong>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-on-surface-variant">{subtitle}</span>}
      </div>
    </div>
  );
}
