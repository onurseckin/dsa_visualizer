import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Slider as BaseSlider } from "@base-ui-components/react/slider";
import { cx } from "../cx";

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "min" | "max" | "step" | "size" | "type"
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
  disabled,
}: SliderProps): React.ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <div className={cx("ui-slider", disabled && "is-disabled", className)} style={style}>
      <div className="ui-slider__header">
        {label !== undefined ? (
          <label className="ui-slider__label" htmlFor={inputId} id={`${inputId}-label`}>
            {label}
          </label>
        ) : (
          <span />
        )}
        <span className="ui-slider__value">{display}</span>
      </div>
      <BaseSlider.Root
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(val: number | readonly number[]) => {
          onChange(typeof val === "number" ? val : val[0]);
        }}
        disabled={disabled}
        className="ui-slider__root"
      >
        <BaseSlider.Control className="ui-slider__control">
          <BaseSlider.Track className="ui-slider__track">
            <BaseSlider.Indicator className="ui-slider__indicator" />
          </BaseSlider.Track>
          <BaseSlider.Thumb
            className="ui-slider__thumb"
            aria-labelledby={label !== undefined ? `${inputId}-label` : undefined}
            id={inputId}
          />
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}
