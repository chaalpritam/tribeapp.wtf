"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { tribeTweetToTweet } from "@/lib/tribe";
import { TweetCard } from "./tweet-card";
import { PollCard } from "./poll-card";
import { EventCard } from "./event-card";
import { TaskCard } from "./task-card";
import { CrowdfundCard } from "./crowdfund-card";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/layout/app-header";
import type { Tweet, Poll, Task, Crowdfund, ExploreItem } from "@/types";

type FeedItemData = Tweet | Poll | Task | Crowdfund | ExploreItem;

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
  const { tweets, polls, events, tasks, crowdfunds, currentCity, tribes } =
    useTribeStore();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>("city");
  const { tweets: hubTweets, loading: hubLoading } = useTribeFeed({
    enabled: activeTab === "all",
  });
  // On-chain events from the hub mirror — surfaced on every tab so
  // anchored events from across users appear alongside seed data.
  // Each row carries onchainEventPda; the EventCard automatically
  // routes RSVP through rsvpOnchain when a wallet is connected.
  const { events: onchainEvents } = useOnchainEvents({
    cityId: currentCity?.id ?? "",
  });

  const adaptedHubTweets = useMemo(
    () =>
      hubTweets.map((t) =>
        tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })
      ),
    [hubTweets, currentCity?.id]
  );

  // Build mixed feed: real hub tweets first (when on the All tab),
  // then seed content interleaved.
  const feedItems: { type: string; data: FeedItemData; key: string }[] = [];

  if (activeTab === "all") {
    adaptedHubTweets.forEach((tweet) => {
      feedItems.push({ type: "tweet", data: tweet, key: `hub-${tweet.id}` });
    });
  }

  tweets.forEach((tweet) => {
    feedItems.push({ type: "tweet", data: tweet, key: tweet.id });
  });

  // Merge on-chain events first (newest / earliest-starting first),
  // then seed events. De-dup on id so a freshly-created event that's
  // already in the seed events array doesn't double-render after the
  // hub picks it up.
  const seenEventIds = new Set<string>();
  const mergedEvents: ExploreItem[] = [];
  for (const e of onchainEvents) {
    if (!seenEventIds.has(e.id)) {
      seenEventIds.add(e.id);
      mergedEvents.push(e);
    }
  }
  for (const e of events) {
    if (!seenEventIds.has(e.id)) {
      seenEventIds.add(e.id);
      mergedEvents.push(e);
    }
  }
  mergedEvents.forEach((event, i) => {
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
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-black text-white shadow-lg shadow-black/10"
                : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("city")}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${
              activeTab === "city"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {currentCity.name}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("following")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${
                activeTab === "following"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              }`}
            >
              Following
            </button>
          )}
        </div>

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
                <span className="text-[12px] sm:text-[14px] font-black tracking-tight text-black">
                  {tribe.name}
                </span>
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

      <div className="px-3 sm:px-6 max-w-2xl mx-auto">
        {activeTab === "all" && hubLoading && adaptedHubTweets.length === 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            loading from hub…
          </div>
        )}

        <div className="flex flex-col gap-4 sm:gap-6">
          {feedItems.map((item) => (
            <div key={item.key} className="w-full">
              {item.type === "tweet" && <TweetCard tweet={item.data as Tweet} />}
              {item.type === "event" && (
                <EventCard event={item.data as ExploreItem} />
              )}
              {item.type === "poll" && <PollCard poll={item.data as Poll} />}
              {item.type === "task" && <TaskCard task={item.data as Task} />}
              {item.type === "crowdfund" && (
                <CrowdfundCard crowdfund={item.data as Crowdfund} />
              )}
            </div>
          ))}
        </div>

        {feedItems.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-xl font-bold tracking-tight">
              Quiet neighborhood…
            </p>
            <p className="text-sm font-medium">
              Be the first to share something in {currentCity.name}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
