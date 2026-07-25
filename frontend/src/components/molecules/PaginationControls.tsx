import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
  showEdges = true,
}: {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  showEdges?: boolean;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <div className="flex items-center gap-1.5">
      {showEdges && (
        <IconButton size="sm" disabled={page <= 1} onClick={() => onPageChange?.(1)} aria-label="First page">
          <Icon className="text-[18px]">first_page</Icon>
        </IconButton>
      )}
      <IconButton size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} aria-label="Previous page">
        <Icon className="text-[18px]">chevron_left</Icon>
      </IconButton>
      {pages.map((value) => (
        <button
          key={value}
          onClick={() => onPageChange?.(value)}
          className={`grid size-8 place-items-center rounded-full text-sm ${
            value === page ? "bg-primary/20 font-medium text-primary" : "text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          {value}
        </button>
      ))}
      <IconButton
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next page"
      >
        <Icon className="text-[18px]">chevron_right</Icon>
      </IconButton>
    </div>
  );
}
