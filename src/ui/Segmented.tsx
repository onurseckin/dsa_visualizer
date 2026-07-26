import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import type { ControlSize } from './Button';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: ControlSize;
}

export function Segmented({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ...rest
}: SegmentedProps): React.ReactElement {
  return (
    <div
      role="group"
      className={cx('ui-segmented', `ui-segmented--${size}`, className)}
      {...rest}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cx('ui-segmented__btn', selected && 'ui-segmented__btn--selected')}
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
    </div>
  );
}
