import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';
import type { ControlSize } from './Button';

/* Native `size` (a character-width number) is replaced by the control-size scale. */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leadingIcon?: ReactNode;
  onClear?: () => void;
  size?: ControlSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leadingIcon, onClear, size = 'md', className, style, value, ...rest },
  ref,
) {
  const showClear =
    onClear !== undefined && value !== undefined && String(value).length > 0;
  return (
    <span
      className={cx(
        'ui-input',
        `ui-input--${size}`,
        leadingIcon !== undefined && leadingIcon !== null && 'ui-input--with-icon',
        showClear && 'ui-input--clearable',
        className,
      )}
      style={style}
    >
      {leadingIcon !== undefined && leadingIcon !== null ? (
        <span className="ui-input__leading" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <input ref={ref} className="ui-input__field" value={value} {...rest} />
      {showClear ? (
        <button type="button" className="ui-input__clear" aria-label="Clear" onClick={onClear}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
});
