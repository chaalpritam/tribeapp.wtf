"use client";

import * as React from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import type { City } from "@/types";

export interface CitySwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: City[];
  currentCityId?: string;
  onCitySelect: (city: City) => void;
}

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function CitySwitcherSheet({
  open,
  onOpenChange,
  cities,
  currentCityId,
  onCitySelect,
}: CitySwitcherSheetProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return cities;
    const q = search.toLowerCase();
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [cities, search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Switch City</SheetTitle>
          <SheetDescription>Select your active city</SheetDescription>
        </SheetHeader>

        <div className="relative px-4 pb-2">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="pl-9 h-9 rounded-lg bg-muted/50 border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  onCitySelect(city);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl p-3 text-left transition-colors",
                  currentCityId === city.id
                    ? "bg-indigo-50 border-2 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-700"
                    : "bg-muted/40 border-2 border-transparent hover:bg-muted"
                )}
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {countryCodeToEmoji(city.countryCode)}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {city.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-2.5" />
                    {city.country}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="size-8 mb-2 opacity-50" />
              <p className="text-sm">No cities found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
