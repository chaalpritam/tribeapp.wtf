"use client";

import { useMemo } from "react";
import { Loader2, Calendar, BarChart3, CheckCircle, Banknote } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
import { tribeTweetToTweet } from "@/lib/tribe";
import { dummyEvents, dummyPolls, dummyTasks, dummyCrowdfunds } from "@/lib/dummy-data";
import { TweetCard } from "./tweet-card";
import { PollCard } from "./poll-card";
import { EventCard } from "./event-card";
import { TaskCard } from "./task-card";
import { CrowdfundCard } from "./crowdfund-card";
import { AppHeader } from "@/components/layout/app-header";
import type { Tweet, Poll, Task, Crowdfund, ExploreItem } from "@/types";

function dedup<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function SectionHeading({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-1 mt-8 mb-3`}>
      <div className={`h-7 w-7 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-[13px] font-black uppercase tracking-widest text-[#222]">{label}</span>
      <div className="flex-1 h-px bg-[#f0f0f0]" />
    </div>
  );
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

  // Fall back to dummy data when hub has returned nothing yet
  const mergedEvents     = useMemo(() => dedup(!eventsLoading && onchainEvents.length === 0 ? dummyEvents     : onchainEvents,     []), [onchainEvents, eventsLoading]);
  const mergedPolls      = useMemo(() => dedup(!pollsLoading  && onchainPolls.length  === 0 ? dummyPolls      : onchainPolls,      []), [onchainPolls,  pollsLoading]);
  const mergedTasks      = useMemo(() => dedup(!tasksLoading  && onchainTasks.length  === 0 ? dummyTasks      : onchainTasks,      []), [onchainTasks,  tasksLoading]);
  const mergedCrowdfunds = useMemo(() => dedup(!fundsLoading  && onchainFunds.length  === 0 ? dummyCrowdfunds : onchainFunds,      []), [onchainFunds,  fundsLoading]);

  const adaptedHubTweets = useMemo(
    () => hubTweets.map((t) => tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })),
    [hubTweets, currentCity?.id]
  );

  const tweetFeed = useMemo(() => {
    const hubIds = new Set(adaptedHubTweets.map((t) => t.id));
    return [...adaptedHubTweets, ...tweets.filter((t) => !hubIds.has(t.id))];
  }, [adaptedHubTweets, tweets]);

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

        {/* ── Posts ── */}
        {hubLoading && adaptedHubTweets.length === 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            loading from hub…
          </div>
        )}

        {tweetFeed.length > 0 ? (
          <div className="flex flex-col gap-4 sm:gap-6">
            {tweetFeed.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet as Tweet} />
            ))}
          </div>
        ) : !hubLoading ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-muted-foreground">
            <p className="text-base font-bold tracking-tight">Quiet neighborhood…</p>
            <p className="text-sm font-medium">Be the first to share something in {currentCity.name}!</p>
          </div>
        ) : null}

        {/* ── Events ── */}
        {mergedEvents.length > 0 && (
          <>
            <SectionHeading icon={Calendar} label="Events" color="bg-teal-500" />
            <div className="flex flex-col gap-4">
              {mergedEvents.map((event) => (
                <EventCard key={event.id} event={event as ExploreItem} />
              ))}
            </div>
          </>
        )}

        {/* ── Polls ── */}
        {mergedPolls.length > 0 && (
          <>
            <SectionHeading icon={BarChart3} label="Polls" color="bg-violet-500" />
            <div className="flex flex-col gap-4">
              {mergedPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll as Poll} />
              ))}
            </div>
          </>
        )}

        {/* ── Tasks ── */}
        {mergedTasks.length > 0 && (
          <>
            <SectionHeading icon={CheckCircle} label="Tasks" color="bg-amber-500" />
            <div className="flex flex-col gap-4">
              {mergedTasks.map((task) => (
                <TaskCard key={task.id} task={task as Task} />
              ))}
            </div>
          </>
        )}

        {/* ── Funds ── */}
        {mergedCrowdfunds.length > 0 && (
          <>
            <SectionHeading icon={Banknote} label="Funds" color="bg-rose-500" />
            <div className="flex flex-col gap-4">
              {mergedCrowdfunds.map((cf) => (
                <CrowdfundCard key={cf.id} crowdfund={cf as Crowdfund} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
