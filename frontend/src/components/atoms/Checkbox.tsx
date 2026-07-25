import type { InputHTMLAttributes } from "react";

export function Checkbox({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={`size-4 rounded accent-primary ${className}`} {...props} />;
}
