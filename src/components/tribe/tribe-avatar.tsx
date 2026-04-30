"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarSizes } from "@/lib/theme";

export type AvatarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "hero";

export interface TribeAvatarProps {
  url?: string | null;
  name?: string;
  size?: AvatarSize;
  ringColor?: string;
  isOnline?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xxs: "size-5",
  xs: "size-7",
  sm: "size-9",
  md: "size-11",
  lg: "size-14",
  xl: "size-[72px]",
  xxl: "size-24",
  hero: "size-[120px]",
};

const onlineDotSizeClasses: Record<AvatarSize, string> = {
  xxs: "size-1.5 border",
  xs: "size-2 border",
  sm: "size-2.5 border-[1.5px]",
  md: "size-3 border-2",
  lg: "size-3.5 border-2",
  xl: "size-4 border-2",
  xxl: "size-5 border-[3px]",
  hero: "size-6 border-[3px]",
};

const textSizeClasses: Record<AvatarSize, string> = {
  xxs: "text-[8px]",
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
  xxl: "text-xl",
  hero: "text-2xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TribeAvatar({
  url,
  name = "",
  size = "md",
  ringColor,
  isOnline,
  className,
}: TribeAvatarProps) {
  const pixelSize = avatarSizes[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {ringColor && (
        <div
          className={cn("absolute -inset-[3px] rounded-full")}
          style={{
            background: `linear-gradient(135deg, ${ringColor}, ${ringColor}88)`,
          }}
        />
      )}
      <Avatar
        className={cn(
          sizeClasses[size],
          ringColor && "ring-2 ring-background"
        )}
      >
        {url ? (
          <Image
            src={url}
            alt={name || "Avatar"}
            width={pixelSize}
            height={pixelSize}
            unoptimized
            className="aspect-square size-full object-cover"
          />
        ) : (
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold",
              textSizeClasses[size]
            )}
          >
            {getInitials(name) || "?"}
          </AvatarFallback>
        )}
      </Avatar>
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-emerald-500 border-background",
            onlineDotSizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
