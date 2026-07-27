import type { HTMLAttributes, ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export interface WellProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "info";
  padding?: "none" | "sm" | "md" | "lg";
  asChild?: boolean;
}

export function Well({
  variant = "default",
  padding = "md",
  className,
  children,
  asChild = false,
  ...rest
}: WellProps): ReactElement {
  const hasPaddingOverride = className?.match(/\bp-\d/) || className?.includes("p-0");

  const paddingClass = hasPaddingOverride
    ? ""
    : padding === "none"
      ? "p-0"
      : padding === "sm"
        ? "p-3 md:p-4"
        : padding === "md"
          ? "p-5 md:p-6"
          : padding === "lg"
            ? "p-6 md:p-8"
            : "";

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cx(
        "ui-well",
        `ui-well--padding-${padding}`,
        variant === "info"
          ? "ui-well--info bg-[var(--bg-alert,#0d1f17)] border border-[var(--border-alert,rgba(16,185,129,0.25))]"
          : "bg-[var(--bg-inset)] border border-[var(--border-default)]",
        "rounded-[var(--radius-md)] shadow-sm overflow-hidden",
        variant === "subtle" && "ui-well--subtle",
        paddingClass,
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
