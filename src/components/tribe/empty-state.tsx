"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { TribeButton } from "./tribe-button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
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
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted/60 mb-4">
        {icon || <Inbox className="size-7 text-muted-foreground" />}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      )}
      {actionLabel && onAction && (
        <TribeButton
          variant="primary"
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
