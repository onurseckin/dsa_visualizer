import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'min' | 'max' | 'step' | 'size' | 'type'
  > {
  label?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  className,
  style,
  id,
  ...rest
}: SliderProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const display = formatValue ? formatValue(value) : String(value);
  return (
    <div className={cx('ui-slider', className)} style={style}>
      <div className="ui-slider__header">
        {label !== undefined ? (
          <label className="ui-slider__label" htmlFor={inputId}>
            {label}
          </label>
        ) : (
          <span />
        )}
        <span className="ui-slider__value">{display}</span>
      </div>
      <input
        id={inputId}
        type="range"
        className="ui-slider__input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        {...rest}
      />
    </div>
  );
}
