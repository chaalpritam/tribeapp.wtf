"use client";

import * as React from "react";
import {
  Leaf,
  HandMetal,
  Home,
  ShieldCheck,
  Landmark,
  Crown,
  FileText,
  HelpCircle,
  CalendarDays,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  karmaLevelConfig,
  getKarmaProgress,
  getNextKarmaLevel,
} from "@/lib/theme";
import type { KarmaLevel, KarmaBreakdown } from "@/types";

export interface KarmaProgressionViewProps {
  level: KarmaLevel;
  totalKarma: number;
  breakdown: KarmaBreakdown;
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

interface BreakdownItem {
  key: keyof KarmaBreakdown;
  label: string;
  icon: React.ElementType;
  color: string;
}

const breakdownItems: BreakdownItem[] = [
  { key: "postsKarma", label: "Posts", icon: FileText, color: "#6366F1" },
  { key: "helpfulKarma", label: "Helpful", icon: HelpCircle, color: "#14B8A6" },
  { key: "eventsKarma", label: "Events", icon: CalendarDays, color: "#FB7185" },
  { key: "communityKarma", label: "Community", icon: Users, color: "#A78BFA" },
];

export function KarmaProgressionView({
  level,
  totalKarma,
  breakdown,
  className,
}: KarmaProgressionViewProps) {
  const config = karmaLevelConfig[level];
  const Icon = levelIcons[level];
  const progress = getKarmaProgress(totalKarma, level);
  const nextLevel = getNextKarmaLevel(level);
  const nextConfig = nextLevel ? karmaLevelConfig[nextLevel] : null;
  const maxBreakdown = Math.max(
    breakdown.postsKarma,
    breakdown.helpfulKarma,
    breakdown.eventsKarma,
    breakdown.communityKarma,
    1
  );

  return (
    <div
      className={cn(
        "rounded-2xl bg-card border p-5 flex flex-col gap-5",
        className
      )}
    >
      {/* Current level */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center size-12 rounded-xl"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="size-6" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">{config.label}</span>
            <span className="text-sm text-muted-foreground">
              {totalKarma.toLocaleString()} karma
            </span>
          </div>
          {nextConfig ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {karmaLevelConfig[nextLevel!].minKarma - totalKarma} karma to{" "}
              {nextConfig.label}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Max level reached
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {nextConfig && (
        <div className="flex flex-col gap-1.5">
          <Progress
            value={progress}
            className="h-2.5"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{config.label}</span>
            <span>{Math.round(progress)}%</span>
            <span>{nextConfig.label}</span>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Karma Breakdown
        </h4>
        {breakdownItems.map((item) => {
          const value = breakdown[item.key];
          const percent = maxBreakdown > 0 ? (value / maxBreakdown) * 100 : 0;
          return (
            <div key={item.key} className="flex items-center gap-2.5">
              <item.icon
                className="size-4 shrink-0"
                style={{ color: item.color }}
              />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
