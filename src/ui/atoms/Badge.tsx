import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import type { DifficultyLevel } from "../../types/dsa";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  asChild?: boolean;
}

export function difficultyBadgeVariant(difficulty: DifficultyLevel): BadgeVariant {
  switch (difficulty) {
    case "Easy":
      return "success";
    case "Medium":
      return "warning";
    case "Hard":
      return "danger";
    default:
      return "neutral";
  }
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "sm", asChild = false, className, children, ...rest }: BadgeProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
): React.ReactElement {
  const Comp = asChild ? Slot : "span";

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs font-medium",
    lg: "px-3.5 py-1.5 text-sm",
  };

  return (
    <Comp
      ref={ref}
      className={cx(
        "ui-badge",
        `ui-badge--${variant}`,
        `ui-badge--${size}`,
        "rounded-full border border-[var(--border-subtle)]",
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});
