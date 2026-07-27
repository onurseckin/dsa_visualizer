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
        "w-full relative flex items-center",
        leadingIcon !== undefined && leadingIcon !== null && "ui-input--with-icon",
        showClear && "ui-input--clearable",
      )}
      style={style}
    >
      {asChild ? (
        rest.children
      ) : (
        <>
          {leadingIcon !== undefined && leadingIcon !== null ? (
            <span className="ui-input__leading absolute left-3.5 z-10 flex items-center text-neutral-400 pointer-events-none" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <BaseInputPrimitive
            ref={ref}
            className={cx(
              "ui-input__field w-full min-h-[44px] px-4 py-2.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition-all",
              leadingIcon !== undefined && leadingIcon !== null && "!pl-11",
              showClear && "!pr-10",
              className,
            )}
            value={value}
            {...rest}
          />
          {showClear ? (
            <button type="button" className="ui-input__clear absolute right-3 z-10 text-neutral-400 hover:text-white" aria-label="Clear" onClick={onClear}>
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </>
      )}
    </Comp>
  );
});
