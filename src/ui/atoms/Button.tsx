import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as BaseButton } from "@base-ui-components/react/button";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  selected?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    selected = false,
    icon,
    fullWidth = false,
    className,
    children,
    type = "button",
    asChild = false,
    ...rest
  }: ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const Comp = asChild ? Slot : BaseButton;
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cx(
        "ui-btn inline-flex items-center justify-center gap-2",
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        variant === "primary" &&
          "bg-[var(--bg-inset)] border border-[var(--accent)] text-[var(--text-primary)]",
        `ui-btn--${size}`,
        size === "sm"
          ? "px-3 py-1.5 text-xs min-h-[36px]"
          : size === "md"
            ? "px-4.5 py-2.5 text-sm min-h-[44px]"
            : size === "lg"
              ? "px-6 py-3 text-base min-h-[48px]"
              : "",
        selected && "ui-btn--selected",
        fullWidth && "ui-btn--full",
        className,
      )}
      aria-pressed={selected || undefined}
      data-state={(rest as Record<string, unknown>)["data-state"] as string | undefined}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon !== undefined && icon !== null ? (
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
