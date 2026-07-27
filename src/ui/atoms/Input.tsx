import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { Input as BaseInputPrimitive } from "@base-ui-components/react/input";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";
import type { ControlSize } from "./Button";

/* Native `size` (a character-width number) is replaced by the control-size scale. */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  leadingIcon?: ReactNode;
  onClear?: () => void;
  size?: ControlSize;
  asChild?: boolean;
}

const BaseInput = BaseInputPrimitive as unknown as {
  Root: React.ElementType;
} & typeof BaseInputPrimitive;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    leadingIcon,
    onClear,
    size: _size = "md",
    className,
    style,
    value,
    asChild = false,
    ...rest
  }: InputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  const showClear = onClear !== undefined && value !== undefined && String(value).length > 0;
  const Comp = asChild ? Slot : (BaseInput.Root ?? "span");
  return (
    <Comp
      className={cx(
        "ui-input",
        `ui-input--${_size}`,
        "w-full min-h-[40px] px-4 py-2.5 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--border-accent)] focus:outline-none",
        leadingIcon !== undefined && leadingIcon !== null && "ui-input--with-icon",
        showClear && "ui-input--clearable",
        className,
      )}
      style={style}
    >
      {asChild ? (
        rest.children
      ) : (
        <>
          {leadingIcon !== undefined && leadingIcon !== null ? (
            <span className="ui-input__leading" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <BaseInputPrimitive ref={ref} className="ui-input__field" value={value} {...rest} />
          {showClear ? (
            <button type="button" className="ui-input__clear" aria-label="Clear" onClick={onClear}>
              <X aria-hidden="true" />
            </button>
          ) : null}
        </>
      )}
    </Comp>
  );
});
