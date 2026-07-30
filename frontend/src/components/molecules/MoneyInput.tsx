import type { InputHTMLAttributes } from "react";
import { Input } from "../atoms/Input";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (minorUnits: number) => void;
};

export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  return (
    <Input
      type="number"
      min="0"
      value={value / 100}
      onChange={(event) => onChange(Math.round(Number(event.target.value) * 100))}
      {...props}
    />
  );
}
