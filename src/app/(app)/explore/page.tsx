"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { EventCard } from "@/components/features/home/event-card";
import { CastCard } from "@/components/features/home/cast-card";

const categories = ["All", "Events", "Trending", "Nearby"];

export default function ExplorePage() {
  const { events, casts, currentCity } = useTribeStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCasts = casts.filter((c) =>
    c.caption.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => {
      if (activeCategory === "Events") return e.type === "event";
      if (activeCategory === "Trending") return e.isTrending;
      return true;
    })
    .sort((a, b) => activeCategory === "Nearby" ? b.participants - a.participants : 0);

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Explore" />

      {/* Search & Categories Bar */}
      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 border-b border-[#f0f0f0]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search in ${currentCity?.name || "your city"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-95 ${activeCategory === cat
                ? "bg-black text-white shadow-lg shadow-black/10"
                : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">
        <div className="flex flex-col gap-6">
          {filteredCasts.map((cast) => (
            <CastCard key={cast.id} cast={cast} />
          ))}
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredCasts.length === 0 && filteredEvents.length === 0 && (
          <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-[32px] bg-muted/30 p-8">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold tracking-tight text-black">No results found</p>
              <p className="text-sm font-medium text-muted-foreground">Try searching for something else in {currentCity?.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
