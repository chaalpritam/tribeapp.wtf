"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, MessageSquare, Calendar, BarChart3, CheckCircle, Banknote } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Tweet, Poll, Task, Crowdfund, ExploreItem } from "@/types";

const GENERAL_CHANNEL_ID = "general";

type FeedTab = "all" | "city" | "mine";
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
  const { isAuthenticated, tid: myTid } = useAuth();

  // Which content type is active
  const [contentTab, setContentTab] = useState<ContentTab>("feed");

  // Tweet feed filters (only used when contentTab === "feed")
  const [feedTab, setFeedTab] = useState<FeedTab>("all");
  const [selectedChannelId, setSelectedChannelId] = useState<string>(GENERAL_CHANNEL_ID);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channelDropdownOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [channelDropdownOpen]);

  const { channels: hubChannels } = useHubChannels();

  const availableChannels = useMemo(() => {
    const next = [...hubChannels];
    if (!next.some((c) => c.id === GENERAL_CHANNEL_ID)) {
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

  // Only fetch tweets when on the Feed tab
  const { tweets: hubTweets, loading: hubLoading } = useTribeFeed(
    contentTab !== "feed"
      ? { enabled: false }
      : feedTab === "mine"
      ? { tid: myTid != null ? String(myTid) : undefined, enabled: myTid != null }
      : { channelId: selectedChannelId || GENERAL_CHANNEL_ID, enabled: true }
  );

  const cityId = currentCity?.id ?? "";
  const { events: onchainEvents } = useOnchainEvents({ cityId });
  const { polls: onchainPolls }   = useOnchainPolls({ cityId });
  const { tasks: onchainTasks }   = useOnchainTasks({ cityId });
  const { crowdfunds: onchainCrowdfunds } = useOnchainCrowdfunds({ cityId });

  const adaptedHubTweets = useMemo(
    () => hubTweets.map((t) => tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })),
    [hubTweets, currentCity?.id]
  );

  const tweetFeed = useMemo(() => {
    const hubIds = new Set(adaptedHubTweets.map((t) => t.id));
    const localOnly = tweets.filter((t) => !hubIds.has(t.id));
    return [...adaptedHubTweets, ...localOnly];
  }, [adaptedHubTweets, tweets]);

  const mergedEvents    = useMemo(() => dedup(onchainEvents, events),         [onchainEvents, events]);
  const mergedPolls     = useMemo(() => dedup(onchainPolls, polls),           [onchainPolls, polls]);
  const mergedTasks     = useMemo(() => dedup(onchainTasks, tasks),           [onchainTasks, tasks]);
  const mergedCrowdfunds= useMemo(() => dedup(onchainCrowdfunds, crowdfunds), [onchainCrowdfunds, crowdfunds]);

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

      {/* Content-type tab bar */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="flex overflow-x-auto no-scrollbar px-3 sm:px-6">
          {contentTabs.map((tab) => {
            const Icon = tab.icon;
            const active = contentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setContentTab(tab.id);
                  setChannelDropdownOpen(false);
                }}
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

        {/* Channel filter row — only on the Feed tab */}
        {contentTab === "feed" && (
          <div className="flex gap-2 items-center px-3 sm:px-6 py-2.5 border-t border-[#f8f8f8]">
            <button
              onClick={() => { setSelectedChannelId(GENERAL_CHANNEL_ID); setFeedTab("all"); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap",
                feedTab === "all"
                  ? "bg-black text-white shadow-sm"
                  : "bg-[#f5f5f5] text-muted-foreground hover:bg-[#eeeeee]"
              )}
            >
              All
            </button>

            <div className="relative" ref={channelDropdownRef}>
              <button
                onClick={() => setChannelDropdownOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap",
                  feedTab === "city"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-[#f5f5f5] text-muted-foreground hover:bg-[#eeeeee]"
                )}
              >
                <span>
                  {feedTab === "city"
                    ? (availableChannels.find((c) => c.id === selectedChannelId)?.name?.trim() || selectedChannelId)
                    : "Channel"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

              {channelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-52 bg-white border border-[#f0f0f0] rounded-[20px] shadow-2xl shadow-black/10 overflow-hidden">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {availableChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannelId(channel.id);
                          setFeedTab("city");
                          setChannelDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-bold transition-all hover:bg-[#f9f9f9] active:scale-95",
                          selectedChannelId === channel.id && feedTab === "city"
                            ? "text-purple-600 bg-purple-50"
                            : "text-black"
                        )}
                      >
                        <span>{channel.id === GENERAL_CHANNEL_ID ? "🌐" : "#"}</span>
                        <span className="truncate">{channel.name?.trim() || channel.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <button
                onClick={() => { setFeedTab("mine"); setChannelDropdownOpen(false); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap",
                  feedTab === "mine"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-[#f5f5f5] text-muted-foreground hover:bg-[#eeeeee]"
                )}
              >
                Mine
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 pt-4 max-w-2xl mx-auto">
        {/* ── Feed (tweets only) ── */}
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
                  <TweetCard key={tweet.id} tweet={tweet} />
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

        {/* ── Events ── */}
        {contentTab === "events" && (
          <>
            {mergedEvents.length > 0 ? (
              <div className="flex flex-col gap-4 sm:gap-6">
                {mergedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Calendar} label="No events yet" sub={`Nothing scheduled in ${currentCity.name} yet.`} />
            )}
          </>
        )}

        {/* ── Polls ── */}
        {contentTab === "polls" && (
          <>
            {mergedPolls.length > 0 ? (
              <div className="flex flex-col gap-4 sm:gap-6">
                {mergedPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll as Poll} />
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart3} label="No polls yet" sub="Ask your neighborhood something." />
            )}
          </>
        )}

        {/* ── Tasks ── */}
        {contentTab === "tasks" && (
          <>
            {mergedTasks.length > 0 ? (
              <div className="flex flex-col gap-4 sm:gap-6">
                {mergedTasks.map((task) => (
                  <TaskCard key={task.id} task={task as Task} />
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle} label="No tasks yet" sub="Post a task to get help from neighbors." />
            )}
          </>
        )}

        {/* ── Funds ── */}
        {contentTab === "funds" && (
          <>
            {mergedCrowdfunds.length > 0 ? (
              <div className="flex flex-col gap-4 sm:gap-6">
                {mergedCrowdfunds.map((cf) => (
                  <CrowdfundCard key={cf.id} crowdfund={cf as Crowdfund} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Banknote} label="No campaigns yet" sub="Start a crowdfund to raise community capital." />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
}) {
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
