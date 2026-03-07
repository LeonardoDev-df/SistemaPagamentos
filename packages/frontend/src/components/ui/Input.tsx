import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-gray-400 ${
            error
              ? "border-red-300 focus:ring-danger-500 focus:border-danger-500"
              : "border-gray-300 hover:border-gray-400"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
