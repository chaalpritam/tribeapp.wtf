"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CityParallaxHeaderProps {
  cityName: string;
  imageUrl: string;
  memberCount?: number;
  scrollOffset: MotionValue<number>;
  height?: number;
  className?: string;
}

export function CityParallaxHeader({
  cityName,
  imageUrl,
  memberCount,
  scrollOffset,
  height = 280,
  className,
}: CityParallaxHeaderProps) {
  const y = useTransform(scrollOffset, [0, height], [0, height * 0.4]);
  const scale = useTransform(scrollOffset, [-100, 0], [1.15, 1]);
  const opacity = useTransform(scrollOffset, [0, height * 0.6], [1, 0]);
  const overlayOpacity = useTransform(scrollOffset, [0, height * 0.5], [0.3, 0.7]);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {/* Parallax image */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image
          src={imageUrl}
          alt={cityName}
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content overlay */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4"
        style={{ opacity }}
      >
        <h1 className="text-3xl font-bold text-white drop-shadow-lg text-center">
          {cityName}
        </h1>
        {memberCount !== undefined && (
          <div className="flex items-center gap-1.5 mt-2 text-white/80 text-sm">
            <Users className="size-3.5" />
            <span>{memberCount.toLocaleString()} members</span>
          </div>
        )}
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
