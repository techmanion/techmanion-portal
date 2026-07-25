export type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
  xl: "size-20",
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
  return (
    <img
      src={src}
      alt={alt}
      className={`shrink-0 rounded-full bg-surface-container-highest object-cover ${sizes[size]} ${ring ? "ring-2 ring-outline-variant/50" : ""} ${className}`}
    />
  );
}
