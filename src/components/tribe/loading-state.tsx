"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  className?: string;
}

export function LoadingState({
  icon,
  title = "Loading...",
  message,
  className,
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted/60 mb-4">
        {icon || (
          <Loader2 className="size-7 text-muted-foreground animate-spin" />
        )}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      )}
      {/* Pulsing dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/50"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
