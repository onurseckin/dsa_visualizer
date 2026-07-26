import type { HTMLAttributes, ReactElement } from "react";
import { cx } from "./cx";

export interface WellProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Well({
  variant = "default",
  padding = "md",
  className,
  children,
  ...rest
}: WellProps): ReactElement {
  return (
    <div
      className={cx(
        "ui-well",
        variant === "subtle" && "ui-well--subtle",
        `ui-well--padding-${padding}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
