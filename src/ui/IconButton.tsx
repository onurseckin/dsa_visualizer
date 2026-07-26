import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import type { ButtonVariant, ControlSize } from "./Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;
  selected?: boolean;
  /* Icon-only buttons carry no text, so a label is mandatory. */
  "aria-label": string;
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
    ...rest
  }: IconButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "ui-btn",
        "ui-icon-btn",
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        selected && "ui-btn--selected",
        className,
      )}
      aria-pressed={selected || undefined}
      {...rest}
    >
      {icon ? (
        <span className="ui-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});
