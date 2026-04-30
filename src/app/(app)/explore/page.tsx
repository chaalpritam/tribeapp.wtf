"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Hash, Loader2, Search, User } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { EventCard } from "@/components/features/home/event-card";
import { TweetCard } from "@/components/features/home/tweet-card";
import { useTribeSearch } from "@/hooks/use-tribe-search";
import { tribeTweetToTweet } from "@/lib/tribe";

const categories = ["All", "Events", "Trending", "Nearby"];

export default function ExplorePage() {
  const { events, tweets, currentCity } = useTribeStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Hub search runs once the query has at least two characters and
  // settles for ~300ms — keeps the network quiet while typing.
  const {
    tweets: hubTweets,
    users: hubUsers,
    channels: hubChannels,
    loading: hubLoading,
  } = useTribeSearch(search);

  const adaptedHubTweets = useMemo(
    () =>
      hubTweets.map((t) =>
        tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })
      ),
    [hubTweets, currentCity?.id]
  );

  const seenIds = new Set<string>();
  const dedupedHubTweets = adaptedHubTweets.filter((t) => {
    if (seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });

  const filteredTweets = tweets.filter((c) =>
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

  const showHubResults = search.trim().length >= 2;
  const hubHasResults =
    dedupedHubTweets.length > 0 ||
    hubUsers.length > 0 ||
    hubChannels.length > 0;

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
          {hubLoading && (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
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
        {showHubResults && hubHasResults && (
          <section className="mb-8 space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#999] px-1">
              From the network
            </h2>

            {hubUsers.length > 0 && (
              <div className="flex flex-col gap-2">
                {hubUsers.map((u) => (
                  <Link
                    key={u.tid}
                    href={`/profile`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] transition-all hover:shadow-md"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold tracking-tight">
                        {u.display_name?.trim() ||
                          (u.username ? `@${u.username}` : `tid:${u.tid}`)}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        tid {u.tid}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {hubChannels.length > 0 && (
              <div className="flex flex-col gap-2">
                {hubChannels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/tribes/${c.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] transition-all hover:shadow-md"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold tracking-tight">
                        {c.name?.trim() || `#${c.id}`}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        {c.member_count} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {dedupedHubTweets.length > 0 && (
              <div className="flex flex-col gap-4">
                {dedupedHubTweets.map((t) => (
                  <TweetCard key={`hub-${t.id}`} tweet={t} />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="flex flex-col gap-6">
          {filteredTweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredTweets.length === 0 &&
          filteredEvents.length === 0 &&
          (!showHubResults || !hubHasResults) && (
            <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-[32px] bg-muted/30 p-8">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold tracking-tight text-black">
                  {showHubResults && hubLoading
                    ? "Searching the network…"
                    : "No results found"}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {showHubResults && hubLoading
                    ? "Hang on while we comb the hub"
                    : `Try searching for something else in ${currentCity?.name}`}
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
