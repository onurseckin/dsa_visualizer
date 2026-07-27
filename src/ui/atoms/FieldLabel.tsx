import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export interface FieldLabelProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: ReactNode;
  asChild?: boolean;
}

export function FieldLabel({
  label,
  hint,
  required = false,
  htmlFor,
  className,
  children,
  asChild = false,
  ...rest
}: FieldLabelProps): ReactElement {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp className={cx("ui-field-label mb-2.5", className)} {...rest}>
      {asChild ? (
        children
      ) : (
        <>
          <div className="ui-field-label__header flex items-center justify-between">
            <label
              htmlFor={htmlFor}
              className="ui-field-label__text text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
            >
              {label}
              {required ? (
                <span className="ui-field-label__required text-[var(--danger)] ml-1">*</span>
              ) : null}
            </label>
            {hint !== undefined && hint !== null ? (
              <span className="ui-field-label__hint text-xs text-[var(--text-muted)]">{hint}</span>
            ) : null}
          </div>
          {children}
        </>
      )}
    </Comp>
  );
}
