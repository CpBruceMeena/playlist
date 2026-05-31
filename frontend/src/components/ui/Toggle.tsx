import { type InputHTMLAttributes } from "react";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  className = "",
  ...props
}: ToggleProps) {
  return (
    <label
      className={`
        flex cursor-pointer items-start gap-3
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `.trim()}
    >
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`
            h-6 w-10 rounded-full transition-all duration-200
            ${checked ? "bg-blue-600" : "bg-neutral-700"}
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950
          `.trim()}
        >
          <div
            className={`
              mt-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200
              ${checked ? "translate-x-[18px]" : "translate-x-0.5"}
            `.trim()}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-neutral-300">{label}</span>
          )}
          {description && (
            <span className="text-xs text-neutral-500">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
