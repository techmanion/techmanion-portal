import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:brightness-105 shadow-md shadow-black/10",
  secondary: "bg-surface-container-highest text-on-surface hover:bg-surface-bright ring-1 ring-outline-variant/40",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
  danger: "bg-error-container text-on-error-container hover:brightness-110",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3.5 text-xs",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-10 gap-2 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-medium transition disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
