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
        "ui-select w-full relative flex items-center",
        size === "sm" && "ui-select--sm",
        className,
      )}
    >
      <select
        className={cx(
          "ui-select__field w-full min-h-[44px] px-4 py-2.5 pr-10 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none appearance-none cursor-pointer transition-all",
          size === "sm" && "min-h-[44px] py-2 text-xs",
        )}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      >
        {children}
      </select>
      <span
        className="ui-select__icon absolute right-3.5 z-10 pointer-events-none text-neutral-400"
        aria-hidden="true"
      >
        <ChevronDown size={16} />
      </span>
    </div>
  );
}
