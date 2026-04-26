"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tribeButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-indigo-500 text-white hover:bg-indigo-600 focus-visible:ring-indigo-500",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-500",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-gray-500",
        outline:
          "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-gray-500",
        coral:
          "bg-rose-400 text-white hover:bg-rose-500 focus-visible:ring-rose-400",
        mint:
          "bg-emerald-400 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface TribeButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof tribeButtonVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

const TribeButton = React.forwardRef<HTMLButtonElement, TribeButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconRight,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(tribeButtonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0 [&>svg]:size-4">{icon}</span>
        ) : null}
        {children}
        {iconRight && !isLoading && (
          <span className="shrink-0 [&>svg]:size-4">{iconRight}</span>
        )}
      </motion.button>
    );
  }
);
TribeButton.displayName = "TribeButton";

export { TribeButton, tribeButtonVariants };
