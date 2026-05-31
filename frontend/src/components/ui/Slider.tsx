import { type InputHTMLAttributes } from "react";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  onChange,
  formatValue,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  ...props
}: SliderProps) {
  const percentage = ((value - Number(min)) / (Number(max) - Number(min))) * 100;

  return (
    <div className="w-full">
      {(label || formatValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-neutral-300">
              {label}
            </label>
          )}
          {formatValue && (
            <span className="text-sm text-neutral-500">{formatValue(value)}</span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={`
            h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800
            outline-none transition-all
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-800
            ${className}
          `.trim()}
          {...props}
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-blue-500/30"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
