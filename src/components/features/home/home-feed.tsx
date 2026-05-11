"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
import { tribeTweetToTweet } from "@/lib/tribe";
import { dummyEvents, dummyPolls, dummyTasks, dummyCrowdfunds, matchesCity } from "@/lib/dummy-data";
import { TweetCard } from "./tweet-card";
import { PollCard } from "./poll-card";
import { EventCard } from "./event-card";
import { TaskCard } from "./task-card";
import { CrowdfundCard } from "./crowdfund-card";
import { AppHeader } from "@/components/layout/app-header";
import type { Tweet, Poll, Task, Crowdfund, ExploreItem } from "@/types";

type FeedItem =
  | { kind: "tweet";    id: string; data: Tweet }
  | { kind: "event";    id: string; data: ExploreItem }
  | { kind: "poll";     id: string; data: Poll }
  | { kind: "task";     id: string; data: Task }
  | { kind: "crowdfund";id: string; data: Crowdfund };

function dedup<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Interleave content buckets into a single feed.
 * Pattern: 2 tweets → 1 non-tweet → 2 tweets → 1 non-tweet …
 * Any leftover items from either side are appended at the end.
 */
function interleaveFeed(
  tweetItems: FeedItem[],
  otherItems: FeedItem[],
): FeedItem[] {
  const result: FeedItem[] = [];
  let ti = 0;
  let oi = 0;
  const TWEETS_PER_SLOT = 2;
  while (ti < tweetItems.length || oi < otherItems.length) {
    for (let i = 0; i < TWEETS_PER_SLOT && ti < tweetItems.length; i++) {
      result.push(tweetItems[ti++]);
    }
    if (oi < otherItems.length) {
      result.push(otherItems[oi++]);
    }
  }
  return result;
}

export function HomeFeed() {
  const { tweets, currentCity } = useTribeStore();

  const { tweets: hubTweets, loading: hubLoading } = useTribeFeed({
    channelId: currentCity?.id ?? "general",
    enabled: true,
  });

  const cityId = currentCity?.id ?? "";
  const { events: onchainEvents,    loading: eventsLoading }   = useOnchainEvents({ cityId });
  const { polls: onchainPolls,      loading: pollsLoading }    = useOnchainPolls({ cityId });
  const { tasks: onchainTasks,      loading: tasksLoading }    = useOnchainTasks({ cityId });
  const { crowdfunds: onchainFunds, loading: fundsLoading }    = useOnchainCrowdfunds({ cityId });

  const cid   = currentCity?.id   ?? "";
  const cname = currentCity?.name ?? "";

  // Fall back to city-filtered dummy data when hub has returned nothing yet
  const mergedEvents     = useMemo(() => dedup(!eventsLoading && onchainEvents.length === 0 ? dummyEvents.filter((e)     => matchesCity(e.cityId,   cid, cname)) : onchainEvents,     []), [onchainEvents, eventsLoading, cid, cname]);
  const mergedPolls      = useMemo(() => dedup(!pollsLoading  && onchainPolls.length  === 0 ? dummyPolls.filter((p)      => matchesCity(p.cityId,   cid, cname)) : onchainPolls,      []), [onchainPolls,  pollsLoading,  cid, cname]);
  const mergedTasks      = useMemo(() => dedup(!tasksLoading  && onchainTasks.length  === 0 ? dummyTasks.filter((t)      => matchesCity(t.cityId,   cid, cname)) : onchainTasks,      []), [onchainTasks,  tasksLoading,  cid, cname]);
  const mergedCrowdfunds = useMemo(() => dedup(!fundsLoading  && onchainFunds.length  === 0 ? dummyCrowdfunds.filter((f) => matchesCity(f.cityId,   cid, cname)) : onchainFunds,      []), [onchainFunds,  fundsLoading,  cid, cname]);

  const adaptedHubTweets = useMemo(
    () => hubTweets.map((t) => tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })),
    [hubTweets, currentCity?.id]
  );

  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const hubIds = new Set(adaptedHubTweets.map((t) => t.id));
    const allTweets = [
      ...adaptedHubTweets,
      ...tweets.filter((t) => !hubIds.has(t.id)),
    ];

    const tweetItems: FeedItem[] = allTweets.map((t) => ({ kind: "tweet", id: t.id, data: t as Tweet }));

    // Shuffle the non-tweet buckets together so the order varies naturally
    const nonTweets: FeedItem[] = [];
    const maxLen = Math.max(mergedEvents.length, mergedPolls.length, mergedTasks.length, mergedCrowdfunds.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < mergedEvents.length)     nonTweets.push({ kind: "event",     id: mergedEvents[i].id,     data: mergedEvents[i] as ExploreItem });
      if (i < mergedPolls.length)      nonTweets.push({ kind: "poll",      id: mergedPolls[i].id,      data: mergedPolls[i] as Poll });
      if (i < mergedTasks.length)      nonTweets.push({ kind: "task",      id: mergedTasks[i].id,      data: mergedTasks[i] as Task });
      if (i < mergedCrowdfunds.length) nonTweets.push({ kind: "crowdfund", id: mergedCrowdfunds[i].id, data: mergedCrowdfunds[i] as Crowdfund });
    }

    return interleaveFeed(tweetItems, nonTweets);
  }, [adaptedHubTweets, tweets, mergedEvents, mergedPolls, mergedTasks, mergedCrowdfunds]);

  if (!currentCity) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#fcfcfc] min-h-screen">
      <AppHeader />

      <div className="px-3 sm:px-6 pt-4 max-w-2xl mx-auto">

        {hubLoading && adaptedHubTweets.length === 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            loading from hub…
          </div>
        )}

        {unifiedFeed.length > 0 ? (
          <div className="flex flex-col gap-4 sm:gap-5">
            {unifiedFeed.map((item) => {
              if (item.kind === "tweet")     return <TweetCard     key={item.id} tweet={item.data} />;
              if (item.kind === "event")     return <EventCard     key={item.id} event={item.data} />;
              if (item.kind === "poll")      return <PollCard      key={item.id} poll={item.data} />;
              if (item.kind === "task")      return <TaskCard      key={item.id} task={item.data} />;
              if (item.kind === "crowdfund") return <CrowdfundCard key={item.id} crowdfund={item.data} />;
            })}
          </div>
        ) : !hubLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-muted-foreground">
            <p className="text-base font-bold tracking-tight">Quiet neighborhood…</p>
            <p className="text-sm font-medium">Be the first to share something in {currentCity.name}!</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}
