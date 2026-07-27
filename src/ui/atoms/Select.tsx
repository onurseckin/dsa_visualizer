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
    <div className="ui-select w-full relative flex items-center">
      <select
        className={cx(
          "ui-select__field w-full min-h-[44px] px-4 py-2.5 pr-10 bg-[#0a0a0c] border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer transition-all",
          size === "sm" && "min-h-[36px] py-1.5 text-xs",
          className,
        )}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      >
        {children}
      </select>
      <span className="ui-select__icon absolute right-3.5 z-10 pointer-events-none text-neutral-400" aria-hidden="true">
        <ChevronDown size={16} />
      </span>
    </div>
  );
}
