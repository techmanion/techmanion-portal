import { Icon } from "./Icon";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Icon className="text-[19px]">account_tree</Icon>
      </div>
      {!compact && <span className="text-[17px] font-semibold tracking-tight text-on-surface">WorkCore</span>}
    </div>
  );
}
