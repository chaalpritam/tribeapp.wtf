"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SearchScope {
  key: string;
  label: string;
}

export interface TribeSearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  scopes?: SearchScope[];
  activeScope?: string;
  onScopeChange?: (scope: string) => void;
  compact?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function TribeSearchBar({
  value,
  onValueChange,
  placeholder = "Search...",
  scopes,
  activeScope,
  onScopeChange,
  compact = false,
  className,
  autoFocus = false,
}: TribeSearchBarProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            compact ? "size-3.5" : "size-4"
          )}
        />
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "pl-9 pr-9 bg-muted/50 border-transparent focus-visible:border-border",
            compact ? "h-8 text-xs rounded-lg" : "h-10 rounded-xl"
          )}
        />
        <AnimatePresence>
          {value.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => onValueChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className={compact ? "size-3.5" : "size-4"} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {scopes && scopes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {scopes.map((scope) => (
            <button
              key={scope.key}
              type="button"
              onClick={() => onScopeChange?.(scope.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeScope === scope.key
                  ? "bg-indigo-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {scope.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
