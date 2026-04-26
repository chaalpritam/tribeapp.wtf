"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Lock, Shield, Hash, Share2, MapPin, Calendar, Crown, MessageSquare } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeChannels } from "@/hooks/use-tribe-channels";
import { useShare } from "@/hooks/use-share";
import { formatNumber, cn } from "@/lib/utils";
import { TweetCard } from "@/components/features/home/tweet-card";
import { EventCard } from "@/components/features/home/event-card";
import type { User } from "@/types";
import { AppHeader } from "@/components/layout/app-header";

const tabs = ["Feed", "Events", "Members", "About"];

export default function TribeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tribes, joinTribe, leaveTribe, tweets, events } = useTribeStore();
  const { join: joinChannel, leave: leaveChannel, ready: chReady } =
    useTribeChannels();
  const { share, showToast } = useShare();
  const [activeTab, setActiveTab] = useState("Feed");
  const [members, setMembers] = useState<User[]>([]);

  const tribe = tribes.find((t) => t.id === id);

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setMembers([]);
  }

  if (!tribe) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Tribe not found</p>
      </div>
    );
  }

  const tribeTweets = tweets.filter((c) => c.tribeId === tribe.id);
  const cityTweets = tweets.filter((c) => c.cityId === tribe.cityId);
  const feedTweets = tribeTweets.length > 0 ? tribeTweets : cityTweets.slice(0, 5);
  const tribeEvents = events.filter((e) => e.cityId === tribe.cityId);

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title={tribe.name} showBackButton />

      {/* Hero Header */}
      <div className="max-w-2xl mx-auto">
        <div className="px-6 py-8">
          <div className="bg-white rounded-[40px] border border-[#f0f0f0] overflow-hidden shadow-sm">
            {tribe.imageUrl && (
              <div className="relative h-56 w-full">
                <Image src={tribe.imageUrl} alt={tribe.name} fill className="object-cover" sizes="(max-width: 800px) 100vw, 800px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">{tribe.name}</h2>
                    {tribe.isPrivate && <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Lock className="h-3 w-3 text-white" /></div>}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-widest border border-white/10">
                      {formatNumber(tribe.members)} Members
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                      Active Now
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-8">
              <p className="text-[16px] font-medium text-[#444] leading-relaxed mb-8">
                {tribe.description}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (tribe.isJoined) {
                      leaveTribe(tribe.id);
                      if (chReady) { try { await leaveChannel(tribe.id); } catch {} }
                    } else {
                      joinTribe(tribe.id);
                      if (chReady) { try { await joinChannel(tribe.id); } catch {} }
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
              {feedTweets.length === 0 ? (
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
            <div className="flex flex-col gap-6">
              {tribeEvents.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-white rounded-[40px] border border-[#f0f0f0] p-8">
                  <div className="h-20 w-20 bg-muted/30 rounded-[32px] flex items-center justify-center mx-auto">
                    <Calendar className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">No Upcoming Events</h4>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Check back soon or gather everyone together!</p>
                  </div>
                </div>
              ) : (
                tribeEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          )}

          {activeTab === "Members" && (
            <div className="flex flex-col gap-3">
              {members.map((member) => {
                const isMod = tribe.moderators.includes(member.id);
                return (
                  <div key={member.id} className="flex items-center gap-4 p-5 rounded-[28px] bg-white border border-[#f0f0f0] shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03]">
                    <div className="relative h-14 w-14 flex-none rounded-[20px] overflow-hidden border border-[#f0f0f0]">
                      <Image src={member.avatarUrl} alt={member.displayName} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[16px] font-black tracking-tight truncate">{member.displayName}</span>
                        {isMod && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            <Crown className="h-2.5 w-2.5" /> Mod
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">@{member.username}</p>
                    </div>
                    {member.karma && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f9f9f9] border border-[#f0f0f0]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getKarmaColor(member.karma.level) }} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-black">{member.karma.level}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-6">
              <div className="bg-white rounded-[40px] border border-[#f0f0f0] p-8 shadow-sm">
                <h3 className="text-xl font-black tracking-tighter mb-6">About this Tribe</h3>

                <div className="space-y-8">
                  {tribe.subchannels.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-4">Channels</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tribe.subchannels.map((sub) => (
                          <div key={sub.id} className="flex items-start gap-4 p-5 rounded-[28px] bg-[#fcfcfc] border border-[#f0f0f0]">
                            <Hash className="h-5 w-5 text-primary mt-1" />
                            <div>
                              <p className="text-[15px] font-bold tracking-tight">{sub.name}</p>
                              <p className="text-[12px] font-medium text-muted-foreground mt-1 leading-snug">{sub.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tribe.rules.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-4">Guidelines</h4>
                      <div className="space-y-3">
                        {tribe.rules.map((rule, i) => (
                          <div key={i} className="flex items-center gap-4 p-5 rounded-[24px] bg-[#fcfcfc] border border-[#f0f0f0] text-[15px] font-medium text-[#444]">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

function getKarmaColor(level: string): string {
  const colors: Record<string, string> = {
    newcomer: "#94A3B8",
    neighbor: "#6366F1",
    local: "#14B8A6",
    trusted: "#FB923C",
    pillar: "#EC4899",
    legend: "#EAB308",
  };
  return colors[level] || "#94A3B8";
}
