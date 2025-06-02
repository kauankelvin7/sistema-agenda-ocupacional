
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  description?: string;
  iconClassName?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "border-l-blue-500 from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
  success: "border-l-green-500 from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
  warning: "border-l-amber-500 from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
  danger: "border-l-red-500 from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
  info: "border-l-cyan-500 from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900"
};

export function StatsCard({
  title,
  value,
  icon,
  description,
  iconClassName,
  trend,
  onClick,
  className,
  variant = "default"
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
        "border-l-4",
        variantStyles[variant],
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8">
        {icon}
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-sm",
            "border border-gray-200 dark:border-gray-600",
            iconClassName
          )}>
            {React.cloneElement(icon as React.ReactElement, { 
              className: "h-5 w-5" 
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </div>
        
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          
          {trend && trend.value > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className={cn(
                "p-1 rounded-full",
                trend.isPositive ? "bg-emerald-100 dark:bg-emerald-900" : "bg-red-100 dark:bg-red-900"
              )}>
                {trend.isPositive ? (
                  <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xs font-bold leading-none",
                    trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  {trend.label}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
