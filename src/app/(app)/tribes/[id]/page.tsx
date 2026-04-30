"use client";

import { use, useMemo, useState } from "react";
import { Lock, Share2, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { useTribeChannels } from "@/hooks/use-tribe-channels";
import { useHubChannel } from "@/hooks/use-hub-channel";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useShare } from "@/hooks/use-share";
import { formatNumber, cn } from "@/lib/utils";
import { TweetCard } from "@/components/features/home/tweet-card";
import { channelInfoToTribe, tribeTweetToTweet } from "@/lib/tribe";
import { AppHeader } from "@/components/layout/app-header";

const tabs = ["Feed", "Events", "About"];

export default function TribeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { join: joinChannel, leave: leaveChannel, ready: chReady } =
    useTribeChannels();
  const { share, showToast } = useShare();
  const [activeTab, setActiveTab] = useState("Feed");
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

  const { channel, loading: channelLoading } = useHubChannel(id);
  const { tweets: hubTweets, loading: feedLoading } = useTribeFeed({
    channelId: id,
    enabled: !!channel,
  });

  const tribe = useMemo(() => {
    if (!channel) return null;
    return channelInfoToTribe(channel, {
      cityId: "",
      isJoined: optimisticJoined ?? false,
    });
  }, [channel, optimisticJoined]);

  if (channelLoading && !tribe) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading channel…</p>
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Channel not found</p>
      </div>
    );
  }

  const feedTweets = hubTweets.map((t) =>
    tribeTweetToTweet(t, { cityId: "" })
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title={tribe.name} showBackButton />

      {/* Hero Header */}
      <div className="max-w-2xl mx-auto">
        <div className="px-6 py-8">
          <div className="bg-white rounded-[40px] border border-[#f0f0f0] overflow-hidden shadow-sm">
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tighter leading-none">{tribe.name}</h2>
                {tribe.isPrivate && (
                  <div className="h-6 w-6 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                    <Lock className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-full bg-[#f5f5f5] text-[11px] font-bold uppercase tracking-widest text-[#666]">
                  {formatNumber(tribe.members)} Members
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  #{tribe.id}
                </span>
              </div>
            </div>

            <div className="p-8">
              <p className="text-[16px] font-medium text-[#444] leading-relaxed mb-8">
                {tribe.description}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const wasJoined = tribe.isJoined;
                    setOptimisticJoined(!wasJoined);
                    if (chReady) {
                      try {
                        if (wasJoined) {
                          await leaveChannel(tribe.id);
                        } else {
                          await joinChannel(tribe.id);
                        }
                      } catch {
                        setOptimisticJoined(wasJoined);
                      }
                    }
                  }}
                  className={cn(
                    "flex-1 h-14 rounded-2xl text-[14px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/5",
                    tribe.isJoined ? "bg-[#f5f5f5] text-[#666]" : "bg-black text-white"
                  )}
                >
                  {tribe.isJoined ? "Member" : "Join Tribe"}
                </button>
                <button
                  onClick={() => share(tribe.name, tribe.description, `${window.location.origin}/tribes/${id}`)}
                  className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#f5f5f5] text-black transition-all hover:bg-[#eeeeee] active:scale-90"
                >
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex px-6 pb-2 gap-2 overflow-x-auto no-scrollbar border-t border-[#f0f0f0] pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-3 rounded-full text-[13px] font-bold transition-all active:scale-95",
                    activeTab === tab
                      ? "bg-black text-white shadow-xl shadow-black/10"
                      : "text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-32">
          {activeTab === "Feed" && (
            <div className="flex flex-col gap-6">
              {feedLoading && feedTweets.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : feedTweets.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-white rounded-[40px] border border-[#f0f0f0] p-8">
                  <div className="h-20 w-20 bg-muted/30 rounded-[32px] flex items-center justify-center mx-auto">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">No Pulse Yet</h4>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Be the first to share something in this tribe!</p>
                  </div>
                </div>
              ) : (
                feedTweets.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))
              )}
            </div>
          )}

          {activeTab === "Events" && (
            <div className="py-20 text-center space-y-4 bg-white rounded-[40px] border border-[#f0f0f0] p-8">
              <div className="h-20 w-20 bg-muted/30 rounded-[32px] flex items-center justify-center mx-auto">
                <Calendar className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div>
                <h4 className="text-xl font-bold tracking-tight">No Upcoming Events</h4>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Channel-scoped event listings need a hub-side index that
                  isn&apos;t exposed yet.
                </p>
              </div>
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-6">
              <div className="bg-white rounded-[40px] border border-[#f0f0f0] p-8 shadow-sm">
                <h3 className="text-xl font-black tracking-tighter mb-6">About this Tribe</h3>
                <p className="text-[15px] font-medium text-[#444] leading-relaxed">
                  {tribe.description ||
                    "No description set. The channel creator can publish a USER_DATA-style description envelope when channel metadata grows."}
                </p>
                {channel?.kind === 2 && channel.latitude != null && channel.longitude != null && (
                  <div className="mt-6 rounded-[24px] bg-[#fcfcfc] border border-[#f0f0f0] p-5 flex items-center gap-4">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#999]">
                      Anchored at
                    </span>
                    <span className="text-[13px] font-bold tracking-tight">
                      {channel.latitude.toFixed(3)}, {channel.longitude.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-2xl">
          Link copied!
        </div>
      )}
    </div>
  );
}
