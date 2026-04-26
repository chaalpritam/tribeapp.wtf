"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TribeAvatar, type AvatarSize } from "./tribe-avatar";

export interface AvatarItem {
  url?: string | null;
  name?: string;
}

export interface AvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

const overlapClasses: Record<AvatarSize, string> = {
  xxs: "-ml-1.5",
  xs: "-ml-2",
  sm: "-ml-2.5",
  md: "-ml-3",
  lg: "-ml-4",
  xl: "-ml-5",
  xxl: "-ml-6",
  hero: "-ml-8",
};

const counterSizeClasses: Record<AvatarSize, string> = {
  xxs: "size-5 text-[7px]",
  xs: "size-7 text-[9px]",
  sm: "size-9 text-[10px]",
  md: "size-11 text-xs",
  lg: "size-14 text-sm",
  xl: "size-[72px] text-base",
  xxl: "size-24 text-lg",
  hero: "size-[120px] text-xl",
};

export function AvatarGroup({
  avatars,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "relative ring-2 ring-background rounded-full",
            index > 0 && overlapClasses[size]
          )}
          style={{ zIndex: visible.length - index }}
        >
          <TribeAvatar url={avatar.url} name={avatar.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background",
            overlapClasses[size],
            counterSizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
