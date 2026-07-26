import type { HTMLAttributes, ReactElement } from "react";
import { cx } from "./cx";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  attached?: boolean;
  fullWidth?: boolean;
  gap?: "none" | "sm" | "md";
}

export function ButtonGroup({
  direction = "row",
  attached = false,
  fullWidth = false,
  gap = "sm",
  className,
  children,
  ...rest
}: ButtonGroupProps): ReactElement {
  return (
    <div
      className={cx(
        "ui-button-group",
        direction === "column" && "ui-button-group--vertical",
        attached && "ui-button-group--attached",
        fullWidth && "ui-button-group--full-width",
        !attached && gap !== "sm" && `ui-button-group--gap-${gap}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
