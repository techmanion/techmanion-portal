import { formatMonth } from "../../lib/format";
import { Icon } from "../atoms/Icon";

export function MonthInput({
  value,
  onChange,
  labelText,
  placeholder = "Select month",
  className = "bg-surface-container-high",
}: {
  value: string;
  onChange: (value: string) => void;
  labelText: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`relative flex h-10 items-center rounded-full px-4 ${className}`}>
      <Icon className="mr-2.5 text-[18px]">calendar_month</Icon>
      <input aria-label={labelText} type="month" value={value} onChange={(event) => onChange(event.target.value)} className="w-32 bg-transparent text-sm font-medium text-on-surface outline-none" />
      <span className={`pointer-events-none absolute inset-y-0 left-11 flex items-center pr-3 text-sm font-medium ${className}`}>{value ? formatMonth(value) : placeholder}</span>
    </label>
  );
}
