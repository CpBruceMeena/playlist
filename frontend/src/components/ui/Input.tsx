import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border bg-neutral-900 px-4 py-2.5 text-sm text-white
              placeholder-neutral-500 outline-none transition-all duration-150
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-neutral-700"}
              ${icon ? "pl-10" : ""}
              ${className}
            `.trim()}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
