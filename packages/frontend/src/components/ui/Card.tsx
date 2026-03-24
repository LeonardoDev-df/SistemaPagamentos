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
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-gray-200/50 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-gray-200/50 p-5 sm:p-6 hover:shadow-md hover:shadow-primary-100/50 transition-all duration-300 hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className={`mt-1 text-xs font-semibold ${
              trend === "up" ? "text-accent-600" : trend === "down" ? "text-danger-600" : "text-gray-400"
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
