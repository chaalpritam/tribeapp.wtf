"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface TribeTextFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  className?: string;
  type?: string;
}

export function TribeTextField({
  value,
  onValueChange,
  label,
  placeholder,
  maxLength,
  error,
  multiline = false,
  rows = 3,
  disabled = false,
  className,
  type = "text",
}: TribeTextFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;
  const id = React.useId();

  const sharedProps = {
    id,
    value,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (maxLength && e.target.value.length > maxLength) return;
      onValueChange(e.target.value);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    placeholder: isFloating ? placeholder : undefined,
    disabled,
    "aria-invalid": !!error,
  };

  return (
    <div className={cn("relative flex flex-col gap-1", className)}>
      <div className="relative">
        <label
          htmlFor={id}
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none z-10",
            isFloating
              ? "top-1 text-[10px] font-medium"
              : "top-1/2 -translate-y-1/2 text-sm",
            error
              ? "text-destructive"
              : isFocused
                ? "text-indigo-500"
                : "text-muted-foreground"
          )}
        >
          {label}
        </label>
        {multiline ? (
          <Textarea
            {...sharedProps}
            rows={rows}
            className={cn(
              "pt-5 resize-none bg-muted/30 border-muted-foreground/20 rounded-xl",
              "focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20",
              error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            )}
          />
        ) : (
          <Input
            {...sharedProps}
            type={type}
            className={cn(
              "h-12 pt-4 bg-muted/30 border-muted-foreground/20 rounded-xl",
              "focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20",
              error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            )}
          />
        )}
      </div>
      <div className="flex items-center justify-between px-1">
        {error ? (
          <p className="text-[11px] text-destructive">{error}</p>
        ) : (
          <span />
        )}
        {maxLength && (
          <p
            className={cn(
              "text-[11px] text-muted-foreground",
              value.length >= maxLength && "text-destructive"
            )}
          >
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
