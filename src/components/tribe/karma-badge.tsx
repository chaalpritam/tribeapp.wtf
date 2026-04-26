"use client";

import * as React from "react";
import {
  Leaf,
  HandMetal,
  Home,
  ShieldCheck,
  Landmark,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { karmaLevelConfig } from "@/lib/theme";
import type { KarmaLevel } from "@/types";

export interface KarmaBadgeProps {
  level: KarmaLevel;
  totalKarma: number;
  compact?: boolean;
  className?: string;
}

const levelIcons: Record<KarmaLevel, React.ElementType> = {
  newcomer: Leaf,
  neighbor: HandMetal,
  local: Home,
  trusted: ShieldCheck,
  pillar: Landmark,
  legend: Crown,
};

function formatKarma(num: number): string {
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}k`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

export function KarmaBadge({
  level,
  totalKarma,
  compact = false,
  className,
}: KarmaBadgeProps) {
  const config = karmaLevelConfig[level];
  const Icon = levelIcons[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
    >
      <Icon className={compact ? "size-3" : "size-3.5"} />
      {!compact && <span>{config.label}</span>}
      <span
        className={cn(
          "font-bold",
          compact ? "text-[10px]" : "text-xs"
        )}
      >
        {formatKarma(totalKarma)}
      </span>
    </div>
  );
}
