import { ReactNode } from "react";

interface CardProps {
  title?: string;
  value?: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down";
  className?: string;
  children?: ReactNode;
}

export function Card({ title, value, subtitle, icon, trend, className = "", children }: CardProps) {
  if (children) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className={`mt-1 text-xs font-medium ${
              trend === "up" ? "text-success-600" : trend === "down" ? "text-danger-600" : "text-gray-400"
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
