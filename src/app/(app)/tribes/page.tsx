"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, Lock, ArrowRight, MapPin, Globe } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeChannels } from "@/hooks/use-tribe-channels";
import { tribeCategoryConfig } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";
import type { TribeCategory, Tribe, City } from "@/types";
import { AppHeader } from "@/components/layout/app-header";
import { cities } from "@/seed/cities";
import { loadCityData } from "@/lib/city-data";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TribesPage() {
  const { tribes, currentCity } = useTribeStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | TribeCategory>("all");

  const filtered = tribes.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const joinedTribes = filtered.filter((t) => t.isJoined);
  const discoverTribes = filtered.filter((t) => !t.isJoined);

  const categories = Array.from(new Set(tribes.map((t) => t.category)));
  const [cityFilter, setCityFilter] = useState<"india" | "international">("india");

  const filteredCities = cities.filter(c => {
    const isCurrent = c.id === currentCity?.id;
    if (isCurrent) return false;
    if (cityFilter === "india") return c.country === "India";
    return c.country !== "India";
  });

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Tribes" />

      {/* Search & Categories Bar */}
      <div className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md px-6 py-4 space-y-4 border-b border-[#f0f0f0]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Find your tribe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-95 ${activeCategory === "all"
              ? "bg-black text-white shadow-lg shadow-black/10"
              : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-95 ${activeCategory === cat
                ? "bg-black text-white shadow-lg shadow-black/10"
                : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
                }`}
            >
              {tribeCategoryConfig[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-10">
        {/* City Channels */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight">City Channels</h2>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Farcaster Powered</p>
            </div>
            <div className="flex bg-[#f3f3f3] p-1 rounded-xl">
              <button
                onClick={() => setCityFilter("india")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                  cityFilter === "india" ? "bg-white text-black shadow-sm" : "text-muted-foreground"
                )}
              >
                India
              </button>
              <button
                onClick={() => setCityFilter("international")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                  cityFilter === "international" ? "bg-white text-black shadow-sm" : "text-muted-foreground"
                )}
              >
                Intl
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredCities.map((city) => (
              <ChannelCard key={city.id} city={city} />
            ))}
          </div>
        </section>

        {/* Your Tribes */}
        {joinedTribes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">Your Tribes</h2>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {joinedTribes.length} Joined
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {joinedTribes.map((tribe) => (
                <TribeCard key={tribe.id} tribe={tribe} />
              ))}
            </div>
          </section>
        )}

        {/* Discover */}
        {discoverTribes.length > 0 && (DiscoverTribesSection(discoverTribes))}

        {filtered.length === 0 && (
          <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-[32px] bg-muted/30 p-8">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold tracking-tight text-black">No tribes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoverTribesSection(tribes: Tribe[]) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight">Discover</h2>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Local Communities
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {tribes.map((tribe) => (
          <TribeCard key={tribe.id} tribe={tribe} />
        ))}
      </div>
    </section>
  )
}

function TribeCard({ tribe }: { tribe: Tribe }) {
  const { joinTribe, leaveTribe } = useTribeStore();
  const { join: joinChannel, leave: leaveChannel, ready } = useTribeChannels();

  return (
    <Link
      href={`/tribes/${tribe.id}`}
      className="group flex items-center gap-5 rounded-[32px] bg-white border border-[#f0f0f0] p-5 transition-all hover:shadow-xl hover:shadow-black/[0.03] active:scale-[0.98]"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[20px] text-white shrink-0 shadow-lg shadow-black/5"
        style={{ backgroundColor: tribe.imageUrl ? 'transparent' : `#${tribe.color}` }}
      >
        {tribe.imageUrl ? (
          <div className="relative h-full w-full rounded-[20px] overflow-hidden">
            <Image src={tribe.imageUrl} alt={tribe.name} fill className="object-cover" />
          </div>
        ) : (
          <Users className="h-7 w-7" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[17px] font-bold tracking-tight truncate">{tribe.name}</span>
          {tribe.isPrivate && <Lock className="h-3.5 w-3.5 text-[#999]" />}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
          {formatNumber(tribe.members)} Members
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          Active Now
        </div>
      </div>

      <button
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (tribe.isJoined) {
            leaveTribe(tribe.id);
            if (ready) {
              try { await leaveChannel(tribe.id); } catch {}
            }
          } else {
            joinTribe(tribe.id);
            if (ready) {
              try { await joinChannel(tribe.id); } catch {}
            }
          }
        }}
        className={cn(
          "h-11 px-6 rounded-full text-[13px] font-bold transition-all shrink-0 active:scale-90",
          tribe.isJoined
            ? "bg-[#f5f5f5] text-[#666] hover:bg-red-50 hover:text-red-500"
            : "bg-black text-white hover:bg-black/90"
        )}
      >
        {tribe.isJoined ? "Member" : "Join"}
      </button>

      <div className="hidden group-hover:block transition-all ml-1">
        <ArrowRight className="h-5 w-5 text-black/20" />
      </div>
    </Link>
  );
}

function ChannelCard({ city }: { city: City }) {
  const { switchCity } = useTribeStore();
  const router = useRouter();

  const handleJump = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem("tribe-selected-city", city.id);
      const data = await loadCityData(city);
      switchCity(city, data);
      router.push("/home");
    } catch (err) {
      console.error("Failed to jump to city:", err);
    }
  };

  return (
    <button
      onClick={handleJump}
      className="group flex items-center gap-5 rounded-[32px] bg-white border border-[#f0f0f0] p-5 transition-all hover:shadow-xl hover:shadow-black/[0.03] active:scale-[0.98] text-left w-full"
    >
      <div className="relative h-16 w-16 rounded-[20px] overflow-hidden shrink-0 shadow-lg shadow-black/5">
        <Image src={city.imageUrl} alt={city.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Globe className="h-6 w-6 text-white animate-pulse" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[17px] font-bold tracking-tight truncate">{city.name}</span>
          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md font-black uppercase">Live</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
          <MapPin className="h-3 w-3" />
          {city.country}
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          {city.memberCountDisplay || formatNumber(city.memberCount)} Members
        </div>
      </div>

      <div className="h-11 px-6 rounded-full bg-purple-600 text-white text-[13px] font-bold flex items-center gap-2 group-hover:bg-purple-700 transition-colors">
        Jump
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}

