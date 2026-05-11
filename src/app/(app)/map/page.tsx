"use client";

import { useState, useMemo } from "react";
import { MapPin, Users, Star, Store, Calendar, Search, Navigation, ChevronRight } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { dummyPlaces, dummyPeople, dummyReviews, dummyEvents } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

type MapFilter = "all" | "people" | "places" | "events" | "reviews";

const FILTERS: { id: MapFilter; label: string; icon: React.ElementType }[] = [
  { id: "all",     label: "All",     icon: MapPin },
  { id: "people",  label: "People",  icon: Users },
  { id: "places",  label: "Places",  icon: Store },
  { id: "events",  label: "Events",  icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={cn("h-3 w-3", s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-[#ddd]")} />
      ))}
    </span>
  );
}

function AvatarCircle({ color, name, size = 40 }: { color: string; name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, background: color }}
      className="rounded-full flex items-center justify-center shrink-0 text-white font-black text-sm"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MapPage() {
  const { currentCity } = useTribeStore();
  const [filter, setFilter] = useState<MapFilter>("all");
  const [search, setSearch] = useState("");

  const cityId = currentCity?.id ?? "";
  const q = search.toLowerCase();

  const places  = useMemo(() => dummyPlaces.filter( (p) => p.cityId  === cityId && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))), [cityId, q]);
  const people  = useMemo(() => dummyPeople.filter( (p) => p.cityId  === cityId && (!q || p.displayName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q))), [cityId, q]);
  const events  = useMemo(() => dummyEvents.filter( (e) => e.cityId  === cityId && (!q || e.title.toLowerCase().includes(q))), [cityId, q]);
  const reviews = useMemo(() => dummyReviews.filter((r) => r.cityId  === cityId && (!q || r.placeName.toLowerCase().includes(q) || r.text.toLowerCase().includes(q))), [cityId, q]);

  const showPeople  = filter === "all" || filter === "people";
  const showPlaces  = filter === "all" || filter === "places";
  const showEvents  = filter === "all" || filter === "events";
  const showReviews = filter === "all" || filter === "reviews";

  const totalItems = people.length + places.length + events.length + reviews.length;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Map" />

      {/* Map placeholder */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f766e" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Road shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200">
          <path d="M0 100 Q100 60 200 100 T400 100" stroke="#0f766e" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <path d="M100 0 Q120 100 100 200" stroke="#0f766e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M300 0 Q280 100 300 200" stroke="#0f766e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0 50 L400 70" stroke="#0f766e" strokeWidth="2" fill="none"/>
          <path d="M0 150 L400 140" stroke="#0f766e" strokeWidth="2" fill="none"/>
        </svg>
        {/* Park blobs */}
        <div className="absolute top-6 left-16 w-20 h-14 rounded-[40%] bg-emerald-200/60" />
        <div className="absolute bottom-8 right-24 w-16 h-12 rounded-[40%] bg-emerald-200/60" />
        {/* Building blocks */}
        <div className="absolute top-4 right-12 w-10 h-10 rounded-lg bg-slate-200/70" />
        <div className="absolute top-4 right-24 w-14 h-8 rounded-lg bg-slate-200/70" />
        <div className="absolute bottom-6 left-10 w-12 h-12 rounded-lg bg-slate-200/70" />

        {/* Dummy pins */}
        {people.slice(0,3).map((p, i) => (
          <div key={p.id} className="absolute" style={{ top: `${25 + i * 18}%`, left: `${20 + i * 22}%` }}>
            <div className="relative">
              <div className="h-8 w-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs" style={{ background: p.avatarColor }}>
                {p.displayName.charAt(0)}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: p.avatarColor }} />
            </div>
          </div>
        ))}
        {places.slice(0,3).map((pl, i) => (
          <div key={pl.id} className="absolute" style={{ top: `${40 + i * 15}%`, left: `${55 + i * 12}%` }}>
            <div className="h-7 w-7 rounded-full bg-white shadow-lg border border-[#e5e5e5] flex items-center justify-center text-base">
              {pl.emoji}
            </div>
          </div>
        ))}

        {/* City label */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-teal-600" />
          <span className="text-[12px] font-black text-[#222]">{currentCity?.name ?? "Select a city"}</span>
        </div>
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-xl px-2 py-1 text-[10px] font-bold text-muted-foreground">
          Live map coming soon
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6">

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${currentCity?.name ?? "your city"}…`}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#f0f0f0] text-[14px] font-medium outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border transition-all shrink-0",
                filter === id
                  ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                  : "bg-white text-[#666] border-[#f0f0f0] hover:border-teal-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* No city selected */}
        {!currentCity && (
          <div className="mt-10 text-center py-16">
            <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-[#222]">No city selected</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a city to see what&apos;s nearby.</p>
          </div>
        )}

        {currentCity && totalItems === 0 && (
          <div className="mt-10 text-center py-16">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-[#222]">{search ? "No results" : "Nothing pinned yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">{search ? "Try a different keyword" : "Content will appear as the community grows."}</p>
          </div>
        )}

        <div className="mt-5 pb-28 space-y-3">

          {/* ── People nearby ── */}
          {showPeople && people.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1 mt-2">People nearby</p>
              {people.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-white border border-[#f0f0f0] rounded-[20px] p-4 hover:shadow-md transition-all">
                  <AvatarCircle color={p.avatarColor} name={p.displayName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-black tracking-tight truncate">{p.displayName}</p>
                      <span className="text-[10px] font-bold text-muted-foreground">@{p.username}</span>
                    </div>
                    <p className="text-[12px] text-[#666] truncate mt-0.5">{p.bio}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        ⚡ {p.karma} karma
                      </span>
                      {p.mutual > 0 && (
                        <span className="text-[10px] font-bold text-teal-600">{p.mutual} mutual</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#ccc] shrink-0" />
                </div>
              ))}
            </>
          )}

          {/* ── Places ── */}
          {showPlaces && places.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1 mt-4">Places</p>
              {places.map((pl) => (
                <div key={pl.id} className="bg-white border border-[#f0f0f0] rounded-[20px] p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-2xl shrink-0">
                      {pl.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-black tracking-tight leading-snug">{pl.name}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                          pl.openNow ? "bg-emerald-50 text-emerald-600" : "bg-[#f5f5f5] text-[#999]"
                        )}>
                          {pl.openNow ? "Open" : "Closed"}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{pl.category}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StarRating rating={pl.rating} />
                        <span className="text-[11px] font-bold text-[#444]">{pl.rating}</span>
                        <span className="text-[11px] text-muted-foreground">({pl.reviewCount})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />{pl.address}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pl.tags.map((t) => (
                          <span key={t} className="text-[10px] font-bold bg-[#f5f5f5] text-[#666] px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Events ── */}
          {showEvents && events.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1 mt-4">Events nearby</p>
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 bg-white border border-[#f0f0f0] rounded-[20px] p-4 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 text-2xl">
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black tracking-tight leading-snug">{e.title}</p>
                    {e.description && (
                      <p className="text-[12px] text-[#666] mt-0.5 line-clamp-2">{e.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {e.location && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                          <MapPin className="h-3 w-3" />{e.location.split("—")[1]?.trim() ?? e.location}
                        </span>
                      )}
                      {e.participants > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                          <Users className="h-3 w-3" />{e.participants} going
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Reviews ── */}
          {showReviews && reviews.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1 mt-4">Community reviews</p>
              {reviews.map((r) => (
                <div key={r.id} className="bg-white border border-[#f0f0f0] rounded-[20px] p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <AvatarCircle color={r.authorColor} name={r.author} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black truncate">{r.author}</p>
                      <p className="text-[10px] font-bold text-teal-600 truncate">{r.placeName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StarRating rating={r.rating} />
                    </div>
                  </div>
                  <p className="text-[13px] text-[#444] leading-relaxed">{r.text}</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2">{r.timeAgo} ago</p>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
