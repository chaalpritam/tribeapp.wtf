"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CityLeapOverlayProps {
  isShowing: boolean;
  cityName: string;
  accentColor?: string;
  className?: string;
}

export function CityLeapOverlay({
  isShowing,
  cityName,
  accentColor = "#6366F1",
  className,
}: CityLeapOverlayProps) {
  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            className
          )}
          style={{ backgroundColor: accentColor }}
        >
          {/* Radial burst rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                ease: "easeOut",
              }}
              className="absolute size-32 rounded-full border-2 border-white/30"
            />
          ))}

          {/* City name */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="flex flex-col items-center gap-3 z-10"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MapPin className="size-10 text-white drop-shadow-lg" />
            </motion.div>
            <motion.h1
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl font-bold text-white drop-shadow-lg"
            >
              {cityName}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.8 }}
              transition={{ delay: 0.25 }}
              className="text-white/80 text-sm"
            >
              Switching city...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
