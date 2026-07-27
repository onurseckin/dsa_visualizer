import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { cx } from "../cx";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  value?: ReactNode;
  size?: "sm" | "md";
  variant?: "default" | "subtle";
  asChild?: boolean;
}

export function ChipLabel({ children }: { children: ReactNode }): ReactElement {
  return <span className="ui-chip__label">{children}</span>;
}

export function ChipValue({ children }: { children: ReactNode }): ReactElement {
  return <span className="ui-chip__value">{children}</span>;
}

export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    label,
    value,
    size = "sm",
    variant = "default",
    asChild = false,
    className,
    children,
    ...rest
  }: ChipProps,
  ref: React.ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cx(
        "ui-chip",
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-mono bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)]",
        size === "md" && "ui-chip--md",
        variant === "subtle" && "ui-chip--subtle",
        className,
      )}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {label !== undefined && label !== null ? (
            <span className="ui-chip__label">{label}</span>
          ) : null}
          {label !== undefined && label !== null && value !== undefined && value !== null ? (
            <span className="ui-chip__sep">:</span>
          ) : null}
          {value !== undefined && value !== null ? (
            <span
              className={cx(
                "ui-chip__value",
                "px-2 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-[var(--radius-sm)]",
              )}
            >
              {value}
            </span>
          ) : null}
          {children}
        </>
      )}
    </Comp>
  );
}) as React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLDivElement>> & {
  Label: typeof ChipLabel;
  Value: typeof ChipValue;
};

Chip.Label = ChipLabel;
Chip.Value = ChipValue;
