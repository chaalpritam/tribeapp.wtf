"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { CastCard } from "./cast-card";
import { PollCard } from "./poll-card";
import { EventCard } from "./event-card";
import { TaskCard } from "./task-card";
import { CrowdfundCard } from "./crowdfund-card";
import { useAuth } from "@/hooks/use-auth";
import { useFarcasterFeed } from "@/hooks/use-farcaster-feed";
import { AppHeader } from "@/components/layout/app-header";
import type { Cast, Poll, Task, Crowdfund, ExploreItem } from "@/types";

type FeedItemData = Cast | Poll | Task | Crowdfund | ExploreItem;


const iconMap: Record<string, string> = {
  bike: "🚲",
  cycling: "🚲",
  utensils: "🍴",
  food: "🍜",
  tech: "💻",
  fitness: "💪",
  music: "🎸",
  camera: "📸",
  mountain: "🏔️",
  landmark: "🏛️",
  palette: "🎨",
  leaf: "🌿",
  rocket: "🚀",
  wine: "🍷",
  pizza: "🍕",
  code: "👨‍💻",
  drama: "🎭",
  users: "👥",
  sun: "☀️",
  dumbbell: "🏋️",
  heart: "❤️",
  star: "⭐",
  "map-pin": "📍",
};

type FeedTab = "all" | "city" | "following";

export function HomeFeed() {
  const { casts, polls, events, tasks, crowdfunds, currentCity, tribes } = useTribeStore();
  const { isAuthenticated, fid } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>("city");

  const {
    casts: farcasterCasts,
    isLoading: fcLoading,
    error: fcError,
    fetchFeed,
    loadMore,
    hasMore,
  } = useFarcasterFeed({
    feedType: activeTab === "following" ? "following" : "filter",
    filterType: activeTab === "city" ? "channel_id" : "global_trending",
    channelId: activeTab === "city" ? currentCity?.farcasterChannelId : undefined,
    fid: isAuthenticated && fid ? fid : undefined,
    limit: 20,
  });

  // Fetch Farcaster feed when tab switches or city changes
  useEffect(() => {
    fetchFeed(true);
  }, [activeTab, currentCity?.farcasterChannelId, fetchFeed]);

  // Build mixed feed for all tab
  const feedItems: { type: string; data: FeedItemData; key: string }[] = [];

  // Local casts
  casts.forEach((cast) => {
    feedItems.push({ type: "cast", data: cast, key: cast.id });
  });

  // Farcaster trending/general casts for "all" tab
  if (activeTab === "all") {
    farcasterCasts.forEach((cast, i) => {
      // Interleave Farcaster casts after every local cast (approximately)
      const insertAt = Math.min(i * 2 + 1, feedItems.length);
      feedItems.splice(insertAt, 0, { type: "cast", data: cast, key: `fc-${cast.id}` });
    });
  }

  events.forEach((event, i) => {
    const insertAt = Math.min((i + 1) * 2, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "event", data: event, key: event.id });
  });

  polls.forEach((poll, i) => {
    const insertAt = Math.min((i + 1) * 3 + 1, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "poll", data: poll, key: poll.id });
  });

  tasks.forEach((task, i) => {
    const insertAt = Math.min((i + 1) * 4 + 2, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "task", data: task, key: task.id });
  });

  crowdfunds.forEach((cf, i) => {
    const insertAt = Math.min((i + 1) * 5 + 3, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "crowdfund", data: cf, key: cf.id });
  });

  if (!currentCity) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#fcfcfc] min-h-screen">
      <AppHeader />

      <div className="px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
        {/* Feed Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${activeTab === "all"
              ? "bg-black text-white shadow-lg shadow-black/10"
              : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("city")}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${activeTab === "city"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              }`}
          >
            {currentCity.name}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("following")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${activeTab === "following"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
                }`}
            >
              Following
            </button>
          )}
        </div>

        {/* Tribe selector - only on all tab */}
        {activeTab === "all" && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
            {tribes.map((tribe) => (
              <button
                key={tribe.id}
                className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white border border-[#f0f0f0] shadow-sm hover:shadow-xl hover:shadow-black/[0.05] transition-all active:scale-95 group shrink-0"
              >
                <div
                  className="h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-full text-lg sm:text-xl shadow-inner group-hover:rotate-12 transition-transform"
                  style={{ backgroundColor: `${tribe.color}15` }}
                >
                  {iconMap[tribe.icon] || tribe.icon}
                </div>
                <span className="text-[12px] sm:text-[14px] font-black tracking-tight text-black">{tribe.name}</span>
              </button>
            ))}
            <button className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-primary/5 text-primary border border-primary/10 shadow-sm shrink-0 font-black text-[12px] sm:text-[14px] hover:bg-primary/10 transition-colors">
              <div className="h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-primary/5">
                <Plus className="h-5 w-5 stroke-[3px]" />
              </div>
              Discover
            </button>
          </div>
        )}
      </div>

      {/* Feed Content */}
      {activeTab === "all" ? (
        <div className="px-3 sm:px-6 max-w-2xl mx-auto">
          {fcLoading && feedItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:gap-6">
                {feedItems.map((item) => (
                  <div key={item.key} className="w-full">
                    {item.type === "cast" && <CastCard cast={item.data as Cast} />}
                    {item.type === "event" && <EventCard event={item.data as ExploreItem} />}
                    {item.type === "poll" && <PollCard poll={item.data as Poll} />}
                    {item.type === "task" && <TaskCard task={item.data as Task} />}
                    {item.type === "crowdfund" && <CrowdfundCard crowdfund={item.data as Crowdfund} />}
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={fcLoading}
                    className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#f0f0f0] text-[13px] font-bold text-muted-foreground hover:bg-muted/30 transition-all active:scale-95 disabled:opacity-50 mt-4"
                  >
                    {fcLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </button>
                )}
              </div>

              {feedItems.length === 0 && !fcLoading && (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="text-xl font-bold tracking-tight">Quiet neighborhood...</p>
                  <p className="text-sm font-medium">Be the first to share something in {currentCity.name}!</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="px-3 sm:px-6 max-w-2xl mx-auto">
          {fcLoading && farcasterCasts.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : fcError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-xl font-bold tracking-tight">Something went wrong</p>
              <p className="text-sm font-medium">{fcError}</p>
              <button
                onClick={() => fetchFeed(true)}
                className="mt-2 px-4 py-2 rounded-full bg-black text-white text-sm font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">
              {farcasterCasts.map((cast: Cast) => (
                <CastCard key={cast.id} cast={cast} />
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={fcLoading}
                  className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#f0f0f0] text-[13px] font-bold text-muted-foreground hover:bg-muted/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {fcLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
              {farcasterCasts.length === 0 && !fcLoading && (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground text-center px-6">
                  <p className="text-xl font-bold tracking-tight">No casts yet</p>
                  <p className="text-sm font-medium max-w-[200px]">
                    {activeTab === "following"
                      ? "Follow people on Farcaster to see their casts here"
                      : `Be the first to cast in the ${currentCity.name} channel!`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
