import type { ReactNode } from "react";

export function DataTable({
  children,
  minWidth = "800px",
  className = "",
}: {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableHeadRow({ children }: { children: ReactNode }) {
  return (
    <tr className="h-11 border-b border-outline-variant/30 text-left text-xs font-medium uppercase tracking-[0.08em] text-on-surface-variant">
      {children}
    </tr>
  );
}

export function TableRow({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`h-12 transition hover:bg-surface-container-highest/40 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}
