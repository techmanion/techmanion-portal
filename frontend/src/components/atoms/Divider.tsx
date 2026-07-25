export function Divider({
  orientation = "horizontal",
  className = "",
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return orientation === "vertical" ? (
    <div className={`h-full w-px shrink-0 bg-outline-variant/40 ${className}`} />
  ) : (
    <div className={`h-px w-full shrink-0 bg-outline-variant/40 ${className}`} />
  );
}
