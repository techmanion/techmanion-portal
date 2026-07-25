export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/40">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden="true">
          <rect x="5" y="7" width="22" height="5.4" rx="2.7" fill="#72ff13" />
          <rect x="13.3" y="12.4" width="5.4" height="13.5" rx="2.7" fill="#72ff13" />
        </svg>
      </div>
      {!compact && <span className="text-[17px] font-semibold tracking-tight text-on-surface">TECH<span className="text-brand-green">MANION</span></span>}
    </div>
  );
}
