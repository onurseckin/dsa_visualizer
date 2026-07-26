import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { cx } from "./cx";

export interface FieldLabelProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: ReactNode;
}

export function FieldLabel({
  label,
  hint,
  required = false,
  htmlFor,
  className,
  children,
  ...rest
}: FieldLabelProps): ReactElement {
  return (
    <div className={cx("ui-field-label", className)} {...rest}>
      <div className="ui-field-label__header">
        <label htmlFor={htmlFor} className="ui-field-label__text">
          {label}
          {required ? <span className="ui-field-label__required">*</span> : null}
        </label>
        {hint !== undefined && hint !== null ? (
          <span className="ui-field-label__hint">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
