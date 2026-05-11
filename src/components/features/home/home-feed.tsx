"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageSquare, Calendar, BarChart3, CheckCircle, Banknote } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
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
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";
import type { Tweet, Poll, Task, Crowdfund, ExploreItem } from "@/types";

type ContentTab = "feed" | "events" | "polls" | "tasks" | "funds";

const contentTabs: { id: ContentTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: MessageSquare },
  { id: "events", label: "Events", icon: Calendar },
  { id: "polls",  label: "Polls",  icon: BarChart3 },
  { id: "tasks",  label: "Tasks",  icon: CheckCircle },
  { id: "funds",  label: "Funds",  icon: Banknote },
];

function dedup<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function HomeFeed() {
  const { tweets, polls, events, tasks, crowdfunds, currentCity } = useTribeStore();
  const [contentTab, setContentTab] = useState<ContentTab>("feed");

  const { tweets: hubTweets, loading: hubLoading } = useTribeFeed({
    channelId: "general",
    enabled: true,
  });

  const cityId = currentCity?.id ?? "";
  const { events: onchainEvents }         = useOnchainEvents({ cityId });
  const { polls: onchainPolls }           = useOnchainPolls({ cityId });
  const { tasks: onchainTasks }           = useOnchainTasks({ cityId });
  const { crowdfunds: onchainCrowdfunds } = useOnchainCrowdfunds({ cityId });

  const adaptedHubTweets = useMemo(
    () => hubTweets.map((t) => tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })),
    [hubTweets, currentCity?.id]
  );

  const tweetFeed = useMemo(() => {
    const hubIds = new Set(adaptedHubTweets.map((t) => t.id));
    return [...adaptedHubTweets, ...tweets.filter((t) => !hubIds.has(t.id))];
  }, [adaptedHubTweets, tweets]);

  const mergedEvents     = useMemo(() => dedup(onchainEvents, events),         [onchainEvents, events]);
  const mergedPolls      = useMemo(() => dedup(onchainPolls, polls),           [onchainPolls, polls]);
  const mergedTasks      = useMemo(() => dedup(onchainTasks, tasks),           [onchainTasks, tasks]);
  const mergedCrowdfunds = useMemo(() => dedup(onchainCrowdfunds, crowdfunds), [onchainCrowdfunds, crowdfunds]);

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

      {/* Content-type tab bar */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="flex overflow-x-auto no-scrollbar px-3 sm:px-6">
          {contentTabs.map((tab) => {
            const Icon = tab.icon;
            const active = contentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setContentTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3.5 text-[12px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all",
                  active
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-black"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 pt-4 max-w-2xl mx-auto">

        {/* Feed (tweets only) */}
        {contentTab === "feed" && (
          <>
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
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <p className="text-xl font-bold tracking-tight">Quiet neighborhood…</p>
                <p className="text-sm font-medium">Be the first to share something in {currentCity.name}!</p>
              </div>
            ) : null}
          </>
        )}

        {/* Events */}
        {contentTab === "events" && (
          mergedEvents.length > 0 ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              {mergedEvents.map((event) => <EventCard key={event.id} event={event as ExploreItem} />)}
            </div>
          ) : (
            <EmptyState icon={Calendar} label="No events yet" sub={`Nothing scheduled in ${currentCity.name} yet.`} />
          )
        )}

        {/* Polls */}
        {contentTab === "polls" && (
          mergedPolls.length > 0 ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              {mergedPolls.map((poll) => <PollCard key={poll.id} poll={poll as Poll} />)}
            </div>
          ) : (
            <EmptyState icon={BarChart3} label="No polls yet" sub="Ask your neighborhood something." />
          )
        )}

        {/* Tasks */}
        {contentTab === "tasks" && (
          mergedTasks.length > 0 ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              {mergedTasks.map((task) => <TaskCard key={task.id} task={task as Task} />)}
            </div>
          ) : (
            <EmptyState icon={CheckCircle} label="No tasks yet" sub="Post a task to get help from neighbors." />
          )
        )}

        {/* Funds */}
        {contentTab === "funds" && (
          mergedCrowdfunds.length > 0 ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              {mergedCrowdfunds.map((cf) => <CrowdfundCard key={cf.id} crowdfund={cf as Crowdfund} />)}
            </div>
          ) : (
            <EmptyState icon={Banknote} label="No campaigns yet" sub="Start a crowdfund to raise community capital." />
          )
        )}

      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <div className="h-16 w-16 rounded-[24px] bg-muted/30 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-lg font-bold tracking-tight text-black">{label}</p>
      <p className="text-sm font-medium">{sub}</p>
    </div>
  );
}
