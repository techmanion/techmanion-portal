import { initials } from "../../lib/format";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
  xl: "size-20",
};

const textSizes: Record<AvatarSize, string> = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-2xl",
};

export function Avatar({
  src,
  alt = "",
  size = "md",
  ring = false,
  className = "",
}: {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  ring?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`grid shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary ${sizes[size]} ${textSizes[size]} ${ring ? "ring-2 ring-outline-variant/50" : ""} ${className}`}
      >
        {initials(alt)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`shrink-0 rounded-full bg-surface-container-highest object-cover ${sizes[size]} ${ring ? "ring-2 ring-outline-variant/50" : ""} ${className}`}
    />
  );
}
