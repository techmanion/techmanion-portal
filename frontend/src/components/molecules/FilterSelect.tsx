import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";

export function FilterSelect({
  value,
  onChange,
  labelText,
  placeholder,
  children,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  labelText: string;
  placeholder: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className="relative">
      <select
        aria-label={labelText}
        className={`h-9 appearance-none rounded-full border-0 bg-surface-container-highest py-0 pl-4 pr-9 text-sm outline-none hover:bg-surface-bright ${value ? "text-on-surface" : "text-on-surface-variant"} ${className}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {children}
      </select>
      <Icon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
        expand_more
      </Icon>
    </label>
  );
}
