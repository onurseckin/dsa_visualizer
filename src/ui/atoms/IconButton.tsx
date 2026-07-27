import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as BaseButton } from "@base-ui-components/react/button";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";
import type { ButtonVariant, ControlSize } from "./Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;
  selected?: boolean;
  /* Icon-only buttons carry no text, so a label is mandatory. */
  "aria-label": string;
  asChild?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    variant = "secondary",
    size = "md",
    selected = false,
    className,
    type = "button",
    children,
    asChild = false,
    ...rest
  }: IconButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const Comp = asChild ? Slot : BaseButton;
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cx(
        "ui-btn",
        "ui-icon-btn",
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        size === "sm"
          ? "p-2 min-h-[36px] min-w-[36px]"
          : size === "md"
            ? "p-2.5 min-h-[44px] min-w-[44px]"
            : size === "lg"
              ? "p-3 min-h-[48px] min-w-[48px]"
              : `ui-btn--${size}`,
        "border border-[var(--border-default)] rounded-[var(--radius-md)]",
        selected && "ui-btn--selected",
        className,
      )}
      aria-pressed={selected || undefined}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon ? (
            <span className="ui-btn__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {children}
        </>
      )}
    </Comp>
  );
});
