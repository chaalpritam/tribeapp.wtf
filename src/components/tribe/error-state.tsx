"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TribeButton } from "./tribe-button";

export interface ErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ErrorState({
  icon,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  actionLabel = "Try Again",
  onAction,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center size-16 rounded-2xl bg-red-50 dark:bg-red-950 mb-4">
        {icon || <AlertTriangle className="size-7 text-red-500" />}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      )}
      {onAction && (
        <TribeButton
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </TribeButton>
      )}
    </motion.div>
  );
}
