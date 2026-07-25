import { Icon } from "../atoms/Icon";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <label className={`flex h-10 min-w-[260px] flex-1 items-center gap-2.5 rounded-full bg-surface-container-highest px-3.5 focus-within:bg-surface-container-highest/80 ${className}`}>
      <Icon className="text-[18px] text-on-surface-variant">search</Icon>
      <input
        aria-label={ariaLabel ?? placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="grid size-5 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
        >
          <Icon className="text-[16px]">close</Icon>
        </button>
      )}
    </label>
  );
}
