"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
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
const GENERAL_CHANNEL_ID = "general";

type FeedTab = "all" | "city" | "mine";

export function HomeFeed() {
  const { tweets, polls, events, tasks, crowdfunds, currentCity } = useTribeStore();
  const { isAuthenticated, tid: myTid } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [selectedChannelId, setSelectedChannelId] =
    useState<string>(GENERAL_CHANNEL_ID);
  const { channels: hubChannels } = useHubChannels();

  // The home feed pulls live tweets from the hub on every tab. The
  // shape of the request is what changes:
  //   all  → /v1/feed/channel/<selectedChannelId> (defaults to general)
  //   city → /v1/feed/channel/<selectedChannelId> (selected channel)
  //   mine → /v1/feed/<myTid>                    (own posts)
  // The hub does not (yet) expose a true personalized
  // "tweets-from-people-I-follow" route, so the third tab surfaces
  // the user's own activity. Only enables once the caller has signed
  // in and a TID is available.
  const { tweets: hubTweets, loading: hubLoading } = useTribeFeed(
    activeTab === "mine"
      ? { tid: myTid != null ? String(myTid) : undefined, enabled: myTid != null }
      : {
          channelId: selectedChannelId || GENERAL_CHANNEL_ID,
          enabled: true,
        }
  );
  const availableChannels = useMemo(() => {
    const next = [...hubChannels];
    const hasGeneral = next.some((channel) => channel.id === GENERAL_CHANNEL_ID);
    if (!hasGeneral) {
      next.unshift({
        id: GENERAL_CHANNEL_ID,
        name: "General",
        description: null,
        kind: 1,
        latitude: null,
        longitude: null,
        created_by: null,
        created_at: null,
        member_count: 0,
        tweet_count: 0,
        last_tweet_at: null,
      });
    }
    return next;
  }, [hubChannels]);
  // On-chain content from the hub mirrors — surfaced on every tab.
  // Each adapted row carries the on-chain PDA so the card components
  // automatically route their primary action (RSVP / vote / claim /
  // pledge) through the on-chain path when a wallet is connected.
  const cityId = currentCity?.id ?? "";
  const { events: onchainEvents } = useOnchainEvents({ cityId });
  const { polls: onchainPolls } = useOnchainPolls({ cityId });
  const { tasks: onchainTasks } = useOnchainTasks({ cityId });
  const { crowdfunds: onchainCrowdfunds } = useOnchainCrowdfunds({ cityId });

  const adaptedHubTweets = useMemo(
    () =>
      hubTweets.map((t) =>
        tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })
      ),
    [hubTweets, currentCity?.id]
  );

  // Build mixed feed: hub tweets first, then any locally-staged
  // tweets the user just published this session (the store keeps a
  // copy of post-publish writes so the new row is visible before
  // gossip catches up).
  const feedItems: { type: string; data: FeedItemData; key: string }[] = [];

  adaptedHubTweets.forEach((tweet) => {
    feedItems.push({ type: "tweet", data: tweet, key: `hub-${tweet.id}` });
  });

  tweets.forEach((tweet) => {
    feedItems.push({ type: "tweet", data: tweet, key: tweet.id });
  });

  // Merge on-chain rows with locally-staged rows of the same type.
  // De-dup on id so a freshly-created item that's already in the
  // local store doesn't double-render after the hub picks it up.
  function dedup<T extends { id: string }>(onchain: T[], local: T[]): T[] {
    const seen = new Set<string>();
    const merged: T[] = [];
    for (const item of [...onchain, ...local]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }

  const mergedEvents = dedup(onchainEvents, events);
  const mergedPolls = dedup(onchainPolls, polls);
  const mergedTasks = dedup(onchainTasks, tasks);
  const mergedCrowdfunds = dedup(onchainCrowdfunds, crowdfunds);

  mergedEvents.forEach((event, i) => {
    const insertAt = Math.min((i + 1) * 2, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "event", data: event, key: event.id });
  });

  mergedPolls.forEach((poll, i) => {
    const insertAt = Math.min((i + 1) * 3 + 1, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "poll", data: poll, key: poll.id });
  });

  mergedTasks.forEach((task, i) => {
    const insertAt = Math.min((i + 1) * 4 + 2, feedItems.length);
    feedItems.splice(insertAt, 0, { type: "task", data: task, key: task.id });
  });

  mergedCrowdfunds.forEach((cf, i) => {
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
            onClick={() => {
              setSelectedChannelId(GENERAL_CHANNEL_ID);
              setActiveTab("all");
            }}
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
            Channels
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("mine")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap ${
                activeTab === "mine"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              }`}
            >
              Mine
            </button>
          )}
        </div>

        {(activeTab === "all" || activeTab === "city") && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
            {availableChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedChannelId(channel.id);
                  setActiveTab("city");
                }}
                className={`flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full border shadow-sm transition-all active:scale-95 group shrink-0 ${
                  selectedChannelId === channel.id
                    ? "bg-black text-white border-black shadow-black/10"
                    : "bg-white border-[#f0f0f0] hover:shadow-xl hover:shadow-black/[0.05]"
                }`}
              >
                <div
                  className="h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-full text-lg sm:text-xl shadow-inner group-hover:rotate-12 transition-transform"
                  style={{
                    backgroundColor:
                      selectedChannelId === channel.id ? "rgba(255,255,255,0.2)" : "#f5f5f5",
                  }}
                >
                  {channel.id === GENERAL_CHANNEL_ID ? "🌐" : "#"}
                </div>
                <span
                  className={`text-[12px] sm:text-[14px] font-black tracking-tight ${
                    selectedChannelId === channel.id ? "text-white" : "text-black"
                  }`}
                >
                  {channel.name?.trim() || channel.id}
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
        {hubLoading && adaptedHubTweets.length === 0 && (
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
