"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tribeBadgeVariants = cva(
  "inline-flex items-center gap-1 font-medium whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        filled: "text-white",
        soft: "border border-transparent",
        outlined: "bg-transparent border",
        dot: "bg-transparent",
      },
      color: {
        indigo: "",
        coral: "",
        mint: "",
        amber: "",
        sky: "",
        purple: "",
        gray: "",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px] rounded-md [&>svg]:size-2.5",
        md: "px-2 py-0.5 text-xs rounded-lg [&>svg]:size-3",
        lg: "px-2.5 py-1 text-sm rounded-lg [&>svg]:size-3.5",
      },
    },
    compoundVariants: [
      // Filled variants
      { variant: "filled", color: "indigo", className: "bg-indigo-500" },
      { variant: "filled", color: "coral", className: "bg-rose-400" },
      { variant: "filled", color: "mint", className: "bg-emerald-400" },
      { variant: "filled", color: "amber", className: "bg-amber-500" },
      { variant: "filled", color: "sky", className: "bg-sky-500" },
      { variant: "filled", color: "purple", className: "bg-purple-500" },
      { variant: "filled", color: "gray", className: "bg-gray-500" },
      // Soft variants
      { variant: "soft", color: "indigo", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
      { variant: "soft", color: "coral", className: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
      { variant: "soft", color: "mint", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
      { variant: "soft", color: "amber", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
      { variant: "soft", color: "sky", className: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
      { variant: "soft", color: "purple", className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
      { variant: "soft", color: "gray", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      // Outlined variants
      { variant: "outlined", color: "indigo", className: "border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400" },
      { variant: "outlined", color: "coral", className: "border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400" },
      { variant: "outlined", color: "mint", className: "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400" },
      { variant: "outlined", color: "amber", className: "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400" },
      { variant: "outlined", color: "sky", className: "border-sky-300 text-sky-600 dark:border-sky-700 dark:text-sky-400" },
      { variant: "outlined", color: "purple", className: "border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400" },
      { variant: "outlined", color: "gray", className: "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400" },
      // Dot variants (same text colors as soft)
      { variant: "dot", color: "indigo", className: "text-indigo-600 dark:text-indigo-400" },
      { variant: "dot", color: "coral", className: "text-rose-600 dark:text-rose-400" },
      { variant: "dot", color: "mint", className: "text-emerald-600 dark:text-emerald-400" },
      { variant: "dot", color: "amber", className: "text-amber-600 dark:text-amber-400" },
      { variant: "dot", color: "sky", className: "text-sky-600 dark:text-sky-400" },
      { variant: "dot", color: "purple", className: "text-purple-600 dark:text-purple-400" },
      { variant: "dot", color: "gray", className: "text-gray-600 dark:text-gray-400" },
    ],
    defaultVariants: {
      variant: "filled",
      color: "indigo",
      size: "md",
    },
  }
);

const dotColorMap: Record<string, string> = {
  indigo: "bg-indigo-500",
  coral: "bg-rose-400",
  mint: "bg-emerald-400",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500",
};

export interface TribeBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof tribeBadgeVariants> {
  icon?: React.ReactNode;
}

export function TribeBadge({
  className,
  variant,
  color,
  size,
  icon,
  children,
  ...props
}: TribeBadgeProps) {
  return (
    <span
      className={cn(tribeBadgeVariants({ variant, color, size, className }))}
      {...props}
    >
      {variant === "dot" && (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            dotColorMap[color || "indigo"]
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export { tribeBadgeVariants };
