"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Leaf,
  HandMetal,
  Home,
  ShieldCheck,
  Landmark,
  Crown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { karmaLevelConfig } from "@/lib/theme";
import type { KarmaLevel } from "@/types";

export interface LevelUpCelebrationProps {
  isShowing: boolean;
  newLevel: KarmaLevel;
  onClose: () => void;
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

function Particle({ index }: { index: number }) {
  const [params] = React.useState(() => {
    const angle = (index / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    const size = 4 + Math.random() * 8;
    const hue = Math.random() * 360;
    const duration = 1.2 + Math.random() * 0.5;
    const delay = 0.2 + Math.random() * 0.3;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size,
      hue,
      duration,
      delay,
    };
  });

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{
        x: params.x,
        y: params.y,
        scale: [0, 1.5, 0],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: params.duration,
        delay: params.delay,
        ease: "easeOut",
      }}
      className="absolute rounded-full"
      style={{
        width: params.size,
        height: params.size,
        backgroundColor: `hsl(${params.hue}, 80%, 65%)`,
      }}
    />
  );
}

export function LevelUpCelebration({
  isShowing,
  newLevel,
  onClose,
  className,
}: LevelUpCelebrationProps) {
  const config = karmaLevelConfig[newLevel];
  const Icon = levelIcons[newLevel];

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm",
            className
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 22,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center gap-4 bg-card rounded-3xl p-8 mx-6 max-w-sm w-full shadow-2xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Particles container */}
            <div className="relative flex items-center justify-center">
              {Array.from({ length: 16 }).map((_, i) => (
                <Particle key={i} index={i} />
              ))}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1,
                }}
                className="flex items-center justify-center size-20 rounded-2xl"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <Icon
                  className="size-10"
                  style={{ color: config.color }}
                />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Congratulations!
              </p>
              <h2 className="text-2xl font-bold">Level Up!</h2>
              <p className="mt-2 text-lg font-semibold" style={{ color: config.color }}>
                {config.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;ve reached a new karma level. Keep contributing to your community!
              </p>
            </motion.div>

            {/* Dismiss */}
            <motion.button
              type="button"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: config.color }}
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
