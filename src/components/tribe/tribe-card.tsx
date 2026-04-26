"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const tribeCardVariants = cva(
  "rounded-xl text-card-foreground transition-all",
  {
    variants: {
      variant: {
        default: "bg-card border shadow-sm",
        elevated: "bg-card border shadow-md hover:shadow-lg",
        outlined: "bg-transparent border-2 border-border",
        soft: "bg-muted/50 border-0",
        glass:
          "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30",
        gradient:
          "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-200/30 dark:border-indigo-800/30",
        flat: "bg-card border-0 shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      radius: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      radius: "md",
    },
  }
);

export interface TribeCardProps
  extends Omit<HTMLMotionProps<"div">, "children">,
    VariantProps<typeof tribeCardVariants> {
  children: React.ReactNode;
  pressable?: boolean;
}

const TribeCard = React.forwardRef<HTMLDivElement, TribeCardProps>(
  (
    {
      className,
      variant,
      padding,
      radius,
      pressable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileTap={pressable ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          tribeCardVariants({ variant, padding, radius, className }),
          pressable && "cursor-pointer"
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
TribeCard.displayName = "TribeCard";

export { TribeCard, tribeCardVariants };
