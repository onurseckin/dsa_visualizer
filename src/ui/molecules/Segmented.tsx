import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import type { ControlSize } from "..";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: ControlSize;
  asChild?: boolean;
}

export const Segmented = forwardRef<HTMLDivElement, SegmentedProps>(function Segmented(
  {
    options,
    value,
    onChange,
    size: _size = "md",
    asChild = false,
    className,
    ...rest
  }: SegmentedProps,
  ref: React.ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      role="group"
      className={cx(
        "ui-segmented",
        `ui-segmented--${_size}`,
        "p-1 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl inline-flex gap-1",
        className,
      )}
      {...rest}
    >
      {asChild
        ? rest.children
        : options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={cx(
                  "ui-segmented__btn",
                  "px-4 py-2 text-xs md:text-sm font-medium rounded-xl min-h-[44px] inline-flex items-center justify-center gap-2 transition-colors",
                  selected && "ui-segmented__btn--selected",
                )}
                aria-pressed={selected}
                onClick={() => {
                  if (!selected) onChange(option.value);
                }}
              >
                {option.icon !== undefined && option.icon !== null ? (
                  <span className="ui-segmented__icon" aria-hidden="true">
                    {option.icon}
                  </span>
                ) : null}
                {option.label}
              </button>
            );
          })}
    </Comp>
  );
});
