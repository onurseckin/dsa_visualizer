import React, { type SelectHTMLAttributes, type ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../cx";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "onChange" | "value"
> {
  size?: "sm" | "md";
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({
  size = "md",
  className,
  children,
  disabled,
  value,
  onChange,
  ...rest
}: SelectProps): ReactElement {
  return (
    <div
      className={cx(
        "ui-select",
        "w-full min-h-[40px] px-4 py-2.5 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] flex items-center justify-between cursor-pointer",
        size === "sm" && "ui-select--sm",
        className,
      )}
    >
      <select
        className="ui-select__field"
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      >
        {children}
      </select>
      <span className="ui-select__icon" aria-hidden="true">
        <ChevronDown />
      </span>
    </div>
  );
}
