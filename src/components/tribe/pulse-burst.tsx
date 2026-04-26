"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PulseBurstProps {
  isActive: boolean;
  color?: string;
  ringCount?: number;
  size?: number;
  className?: string;
}

export function PulseBurst({
  isActive,
  color = "#F472B6",
  ringCount = 3,
  size = 40,
  className,
}: PulseBurstProps) {
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    if (isActive) {
      setKey((prev) => prev + 1);
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none",
        className
      )}
    >
      <AnimatePresence>
        {isActive && (
          <React.Fragment key={key}>
            {Array.from({ length: ringCount }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.3, opacity: 0.7 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute rounded-full border-2"
                style={{
                  width: size,
                  height: size,
                  borderColor: color,
                }}
              />
            ))}
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
