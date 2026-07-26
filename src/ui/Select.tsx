import type { SelectHTMLAttributes, ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md";
}

export function Select({
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: SelectProps): ReactElement {
  return (
    <div className={cx("ui-select", size === "sm" && "ui-select--sm", className)}>
      <select className="ui-select__field" disabled={disabled} {...rest}>
        {children}
      </select>
      <span className="ui-select__icon" aria-hidden="true">
        <ChevronDown />
      </span>
    </div>
  );
}
