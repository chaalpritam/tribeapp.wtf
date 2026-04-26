"use client";

import { useState } from "react";
import { MapPin, Users, Calendar, Navigation, Coffee, Dumbbell, Music, Zap } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";

const filters = [
  { id: "all", label: "All", icon: MapPin },
  { id: "events", label: "Events", icon: Calendar },
  { id: "people", label: "People", icon: Users },
  { id: "places", label: "Places", icon: Coffee },
];

const mockPins = [
  { id: 1, type: "event", label: "Yoga in the Park", x: 35, y: 25, color: "#14B8A6", icon: Dumbbell, attendees: 12 },
  { id: 2, type: "people", label: "3 members nearby", x: 55, y: 40, color: "#6366F1", icon: Users, attendees: 3 },
  { id: 3, type: "event", label: "Live Music Night", x: 70, y: 55, color: "#A78BFA", icon: Music, attendees: 45 },
  { id: 4, type: "places", label: "Co-working Hub", x: 25, y: 60, color: "#FB923C", icon: Coffee, attendees: 8 },
  { id: 5, type: "event", label: "Cycling Meetup", x: 60, y: 20, color: "#FB7185", icon: Zap, attendees: 22 },
  { id: 6, type: "people", label: "5 members nearby", x: 40, y: 70, color: "#6366F1", icon: Users, attendees: 5 },
  { id: 7, type: "places", label: "Community Garden", x: 80, y: 35, color: "#14B8A6", icon: MapPin, attendees: 6 },
];

export default function MapPage() {
  const { currentCity, events } = useTribeStore();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  const filteredPins = activeFilter === "all"
    ? mockPins
    : mockPins.filter((p) => p.type === activeFilter);

  const nearbyCount = events.length;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Map" />
      <div className="px-3 sm:px-6 pt-2">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] font-bold text-amber-800">
          Demo data — real geo discovery uses USER_DATA &quot;city&quot; and
          EVENT_ADD lat/long.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-[#f0f0f0]">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-95",
                activeFilter === f.id
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Map Area */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-[24px] sm:rounded-[40px] border border-[#f0f0f0] bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 shadow-sm shadow-black/5">
          {/* Grid lines for map feel */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-foreground/20" style={{ top: `${(i + 1) * 12.5}%` }} />
            ))}
            {[...Array(8)].map((_, i) => (
              <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-foreground/20" style={{ left: `${(i + 1) * 12.5}%` }} />
            ))}
          </div>

          {/* Roads */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute left-[20%] top-0 bottom-0 w-1 bg-foreground/30 rounded-full" />
            <div className="absolute left-[50%] top-0 bottom-0 w-1.5 bg-foreground/40 rounded-full" />
            <div className="absolute left-0 right-0 top-[45%] h-1.5 bg-foreground/40 rounded-full" />
            <div className="absolute left-0 right-0 top-[75%] h-1 bg-foreground/30 rounded-full" />
          </div>

          {/* User Location */}
          <div className="absolute z-20" style={{ left: "48%", top: "45%" }}>
            <div className="relative">
              <div className="absolute -inset-4 animate-ping rounded-full bg-primary/20" />
              <div className="absolute -inset-2 rounded-full bg-primary/30" />
              <div className="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow-lg" />
            </div>
          </div>

          {/* Pins */}
          {filteredPins.map((pin) => {
            const Icon = pin.icon;
            const isSelected = selectedPin === pin.id;
            return (
              <button
                key={pin.id}
                onClick={() => setSelectedPin(isSelected ? null : pin.id)}
                className="absolute z-10 transition-transform hover:scale-110"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[16px] shadow-lg transition-all border-2 border-white",
                  isSelected && "scale-125 ring-4 ring-black/5"
                )} style={{ backgroundColor: pin.color }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                {isSelected && (
                  <div className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 whitespace-nowrap rounded-[20px] bg-black text-white px-4 py-2 text-[12px] font-bold shadow-2xl">
                    {pin.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Locate me button */}
          <button className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl border border-[#f0f0f0] hover:bg-[#f9f9f9] transition-all active:scale-90">
            <Navigation className="h-6 w-6 text-black" />
          </button>
        </div>

        {/* Bottom stats cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8">
          <div className="rounded-[20px] sm:rounded-[32px] bg-white border border-[#f0f0f0] p-4 sm:p-6 text-center shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="text-lg sm:text-xl font-black leading-none">8</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 sm:mt-2 font-mono">Nearby</p>
          </div>
          <div className="rounded-[20px] sm:rounded-[32px] bg-white border border-[#f0f0f0] p-4 sm:p-6 text-center shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="text-lg sm:text-xl font-black leading-none">{nearbyCount}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 sm:mt-2 font-mono">Events</p>
          </div>
          <div className="rounded-[20px] sm:rounded-[32px] bg-white border border-[#f0f0f0] p-4 sm:p-6 text-center shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="text-lg sm:text-xl font-black leading-none">4</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 sm:mt-2 font-mono">Places</p>
          </div>
        </div>
      </div>
    </div>
  );
}
