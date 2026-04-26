"use client";

import * as React from "react";
import { ChevronDown, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CitySwitcherSheet } from "./city-switcher-sheet";
import type { City } from "@/types";

export interface CityHeaderProps {
  city: City;
  cities: City[];
  onCityChange: (city: City) => void;
  className?: string;
}

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function CityHeader({
  city,
  cities,
  onCityChange,
  className,
}: CityHeaderProps) {
  const [showSwitcher, setShowSwitcher] = React.useState(false);

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowSwitcher(true)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-muted/60 transition-colors",
          className
        )}
      >
        <span className="text-lg">{countryCodeToEmoji(city.countryCode)}</span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold leading-tight">{city.name}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="size-2.5" />
            {city.memberCount.toLocaleString()} members
          </span>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground ml-0.5" />
      </motion.button>

      <CitySwitcherSheet
        open={showSwitcher}
        onOpenChange={setShowSwitcher}
        cities={cities}
        currentCityId={city.id}
        onCitySelect={onCityChange}
      />
    </>
  );
}
