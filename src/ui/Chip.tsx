import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { cx } from "./cx";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  value?: ReactNode;
  size?: "sm" | "md";
  variant?: "default" | "subtle";
}

export function ChipLabel({ children }: { children: ReactNode }): ReactElement {
  return <span className="ui-chip__label">{children}</span>;
}

export function ChipValue({ children }: { children: ReactNode }): ReactElement {
  return <span className="ui-chip__value">{children}</span>;
}

export function Chip({
  label,
  value,
  size = "sm",
  variant = "default",
  className,
  children,
  ...rest
}: ChipProps): ReactElement {
  return (
    <div
      className={cx(
        "ui-chip",
        size === "md" && "ui-chip--md",
        variant === "subtle" && "ui-chip--subtle",
        className,
      )}
      {...rest}
    >
      {label !== undefined && label !== null ? (
        <span className="ui-chip__label">{label}</span>
      ) : null}
      {label !== undefined && label !== null && value !== undefined && value !== null ? (
        <span className="ui-chip__sep">:</span>
      ) : null}
      {value !== undefined && value !== null ? (
        <span className="ui-chip__value">{value}</span>
      ) : null}
      {children}
    </div>
  );
}

Chip.Label = ChipLabel;
Chip.Value = ChipValue;
