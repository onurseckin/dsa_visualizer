import { forwardRef } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  attached?: boolean;
  fullWidth?: boolean;
  gap?: "none" | "sm" | "md";
  asChild?: boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  {
    direction = "row",
    attached = false,
    fullWidth = false,
    gap = "sm",
    className,
    children,
    asChild = false,
    ...rest
  }: ButtonGroupProps,
  ref: React.ForwardedRef<HTMLDivElement>,
): ReactElement {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cx(
        "ui-button-group inline-flex items-center rounded-[var(--radius-md)] shadow-sm",
        "*:not(:first-child):-ml-px",
        direction === "column" && "ui-button-group--vertical",
        attached && "ui-button-group--attached",
        fullWidth && "ui-button-group--full-width",
        !attached && gap !== "sm" && `ui-button-group--gap-${gap}`,
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});
