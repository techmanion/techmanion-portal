import type { ButtonHTMLAttributes } from "react";

export type IconButtonVariant = "ghost" | "filled" | "tonal";
export type IconButtonSize = "sm" | "md" | "lg";

const variants: Record<IconButtonVariant, string> = {
  ghost: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
  filled: "bg-primary text-on-primary hover:brightness-105",
  tonal: "bg-primary/15 text-primary hover:bg-primary/20",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "size-8 text-[16px]",
  md: "size-9 text-[18px]",
  lg: "size-10 text-[20px]",
};

export function IconButton({
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}) {
  return (
    <button
      className={`grid shrink-0 place-items-center rounded-full transition disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
