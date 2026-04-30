"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Settings, MapPin, BadgeCheck, Star, Award, PlusCircle, Heart, MessageCircle, Share2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useTribeStore } from "@/store/use-tribe-store";
import { TweetCard } from "@/components/features/home/tweet-card";
import { useAuth } from "@/hooks/use-auth";
import { useTribeUserData } from "@/hooks/use-tribe-user-data";
import { useTribeUser } from "@/hooks/use-tribe-user";
import { useTribeKarma } from "@/hooks/use-tribe-karma";
import { useTribeOnchainKarma } from "@/hooks/use-tribe-onchain-karma";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useTribeFollowList, type FollowListKind } from "@/hooks/use-tribe-follow-list";
import { resolveMediaUrl, tribeTweetToTweet } from "@/lib/tribe";
import { karmaLevelConfig, getKarmaProgress } from "@/lib/theme";
import { cn, formatNumber } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useShare } from "@/hooks/use-share";
import { AppHeader } from "@/components/layout/app-header";

const tabs = ["Posts", "Media", "Stats"];

import type { Tweet } from "@/types";
import { Loader2 } from "lucide-react";

function ActivityGrid({ tweets, isLoading }: { tweets: Tweet[]; isLoading?: boolean }) {
  const mediaTweets = tweets.filter((c) => c.imageUrl).slice(0, 9);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mediaTweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-[32px] bg-muted/30 p-8 mb-6">
          <Award className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-xl font-bold tracking-tight text-black">No media yet</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">Share photos from your local journey</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 sm:px-6 pb-20">
      {mediaTweets.map((tweet) => (
        <div key={tweet.id} className="group relative aspect-square overflow-hidden rounded-[20px] bg-muted border border-[#f0f0f0]">
          <Image
            src={tweet.imageUrl!}
            alt={tweet.caption}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-110 duration-500"
            sizes="(max-width: 640px) 33vw, 200px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-3 text-white text-[13px] font-bold">
              <span className="flex items-center gap-1.5 backdrop-blur-md bg-white/20 px-3 py-1.5 rounded-full">
                <Heart className="h-4 w-4 fill-white" /> {tweet.likes}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostsFeed({ tweets, isLoading }: { tweets: Tweet[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-[32px] bg-muted/30 p-8 mb-6">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-xl font-bold tracking-tight text-black">No posts yet</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">Share your thoughts with the community</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 sm:px-6 pb-24">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, updateCurrentUser, currentCity, tweets } = useTribeStore();
  const { isAuthenticated, profile, tid } = useAuth();
  const { setFields: publishUserData, error: publishError } = useTribeUserData();
  const { user: hubUser } = useTribeUser(tid ?? null);
  const { karma: hubKarma } = useTribeKarma(tid ?? null);
  const { karma: onchainKarma } = useTribeOnchainKarma(tid ?? null);
  // The user's own tweets, served by /v1/feed/<tid> on the hub.
  // Despite the route name, this returns posts authored by `tid`,
  // not a personalized following feed.
  const { tweets: hubOwnTweets, loading: hubOwnLoading } = useTribeFeed({
    tid: tid != null ? String(tid) : undefined,
    enabled: tid != null,
  });
  const [followListKind, setFollowListKind] = useState<FollowListKind | null>(null);
  const { users: followListUsers, loading: followListLoading } =
    useTribeFollowList(tid ?? null, followListKind ?? "followers", followListKind !== null);
  const { share, showToast } = useShare();
  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#fcfcfc] min-h-screen">
        <AppHeader title="Profile" />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <div className="rounded-[32px] bg-purple-50 p-8 mb-6">
            <ShieldCheck className="h-10 w-10 text-purple-300" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-black mb-2">Sign in to view your profile</h2>
          <p className="text-sm font-medium text-muted-foreground mb-8 max-w-sm">
            Connect your Solana wallet to claim a Tribe ID, then view your profile, followers, and tweets.
          </p>
          <a
            href="/onboarding/connect"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-black text-white text-[14px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10"
          >
            Sign in with Tribe
          </a>
        </div>
      </div>
    );
  }

  // Map the hub's numeric level (1-5) onto the seed's named scale.
  const KARMA_LEVELS: Array<
    "newcomer" | "neighbor" | "local" | "trusted" | "pillar" | "legend"
  > = ["newcomer", "neighbor", "local", "trusted", "pillar", "legend"];
  const hubLevelName = hubKarma
    ? KARMA_LEVELS[Math.min(hubKarma.level, KARMA_LEVELS.length - 1)]
    : null;

  // Hub karma wins when available; falls back to seed user karma.
  const karma = hubKarma && hubLevelName
    ? {
        totalKarma: hubKarma.total,
        level: hubLevelName,
        breakdown: {
          tweetKarma: hubKarma.breakdown.tweets * (hubKarma.weights.tweet ?? 1),
          reactionKarma:
            hubKarma.breakdown.reactions_received *
            (hubKarma.weights.reactionReceived ?? 2),
          followerKarma:
            hubKarma.breakdown.followers * (hubKarma.weights.follower ?? 5),
          tipKarma:
            hubKarma.breakdown.tips_received *
            (hubKarma.weights.tipReceived ?? 10),
          taskKarma:
            hubKarma.breakdown.tasks_completed *
            (hubKarma.weights.taskCompleted ?? 20),
        },
      }
    : currentUser?.karma;
  const levelConfig = karma ? karmaLevelConfig[karma.level] : null;
  const progress = karma ? getKarmaProgress(karma.totalKarma, karma.level) : 0;

  const hubUsername = hubUser?.username ?? null;
  const hubProfile = hubUser?.profile ?? {};

  const displayName =
    hubProfile.displayName ||
    profile?.displayName ||
    profile?.username ||
    currentUser?.displayName ||
    `tid:${tid ?? "?"}`;

  const displayBio = hubProfile.bio || currentUser?.bio || "";

  const displayAvatar =
    resolveMediaUrl(hubProfile.pfpUrl) ||
    profile?.image ||
    currentUser?.avatarUrl ||
    "/default-avatar.png";

  const displayHandle = hubUsername
    ? `@${hubUsername}`
    : profile?.username
      ? `@${profile.username}`
      : currentUser?.username
        ? `@${currentUser.username}`
        : tid
          ? `tid:${tid}`
          : "";

  const socialCounts = {
    followers: hubUser?.followers_count ?? 0,
    following: hubUser?.following_count ?? 0,
    posts: 0,
  };

  // Merge hub posts (live, identified by hash) with seed posts that
  // the local store still keeps around for the demo experience.
  // Dedupe on id — a hub-fetched tweet that's also in seed (e.g.
  // re-imported during demo seeding) shouldn't render twice.
  const adaptedHubOwn = hubOwnTweets.map((t) =>
    tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })
  );
  const seedOwn = currentUser
    ? tweets.filter((c) => c.user.id === currentUser.id)
    : [];
  const seenIds = new Set<string>();
  const allPosts = [...adaptedHubOwn, ...seedOwn].filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Profile" />

      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="px-3 sm:px-6 py-6 sm:py-8">
          <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-[#f0f0f0] p-5 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Visual Flair */}
            <div className="absolute top-0 right-0 p-8">
              <div className="bg-rose-50 text-rose-500 rounded-full h-12 w-12 flex items-center justify-center">
                <Zap className="h-6 w-6 fill-current" />
              </div>
            </div>

            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5 sm:gap-8">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-none rounded-[28px] sm:rounded-[40px] overflow-hidden border-4 border-[#f9f9f9] shadow-inner shrink-0">
                <Image
                  src={displayAvatar}
                  alt={displayName || "Profile"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="flex-1 text-center sm:text-left pt-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-black flex items-center justify-center sm:justify-start gap-2">
                  {displayName}
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </h2>
                <p className="text-primary font-bold tracking-widest uppercase text-[11px] mt-1.5">
                  {displayHandle}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 mt-4 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setFollowListKind("followers")}
                    className="text-center sm:text-left transition-opacity hover:opacity-70"
                  >
                    <p className="text-[17px] sm:text-[20px] font-black leading-none">{formatNumber(socialCounts.followers)}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Followers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowListKind("following")}
                    className="text-center sm:text-left transition-opacity hover:opacity-70"
                  >
                    <p className="text-[17px] sm:text-[20px] font-black leading-none">{formatNumber(socialCounts.following)}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Following</p>
                  </button>
                  <div className="text-center sm:text-left">
                    <p className="text-[17px] sm:text-[20px] font-black leading-none">{karma?.totalKarma || 0}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Karma</p>
                  </div>
                </div>
              </div>
            </div>

            {displayBio && (
              <p className="mt-8 text-[16px] font-medium text-[#444] leading-relaxed max-w-lg">
                {displayBio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-8">
              <div className="flex items-center gap-2 px-5 py-3 rounded-[20px] bg-[#f9f9f9] border border-[#f0f0f0]">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-bold">{currentUser?.location || "Earth"}</span>
              </div>
              {tid !== null && (
                <div className="flex items-center gap-2 px-5 py-3 rounded-[20px] bg-indigo-50 border border-indigo-100">
                  <span className="text-[13px] font-bold text-indigo-600">TID #{tid}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-10">
              <button
                onClick={() => {
                  setEditName(displayName || "");
                  setEditBio(displayBio || "");
                  setEditLocation(currentUser?.location || "");
                  setIsEditing(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 h-12 sm:h-14 rounded-2xl bg-black text-white text-[13px] sm:text-[14px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10"
              >
                Edit Profile
              </button>
              <button
                onClick={() => share(displayName, displayBio || "", `${window.location.origin}/profile`)}
                className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-2xl bg-[#f5f5f5] text-black transition-all hover:bg-[#eeeeee] active:scale-90"
              >
                <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <Link
                href="/settings"
                className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-2xl bg-[#f5f5f5] text-black transition-all hover:bg-[#eeeeee] active:scale-90"
              >
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            </div>
          </div>
        </div>

        {/* Karma Pulse Section */}
        {karma && levelConfig && (
          <div className="px-3 sm:px-6 pb-6 sm:pb-8">
            <div className="p-5 sm:p-8 rounded-[24px] sm:rounded-[40px] bg-indigo-50 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 flex items-center justify-center rounded-[24px] bg-white text-indigo-500 shadow-lg shadow-indigo-500/10">
                    <Zap className="h-7 w-7 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-indigo-900 leading-none lowercase">{levelConfig.label}</h3>
                    <p className="text-[11px] font-bold text-indigo-500/60 uppercase tracking-widest mt-2">Level {karma.level} Explorer</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-900 leading-none">{formatNumber(karma.totalKarma)}</p>
                  <p className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest mt-2">Total Points</p>
                </div>
              </div>
              <Progress value={progress} className="h-3 bg-indigo-900/10" />
              <div className="mt-4 flex justify-between text-[11px] font-bold uppercase tracking-widest text-indigo-900/40">
                <span>Recent Milestones</span>
                <span>{Math.round(progress)}% to Level {karma.level + 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* On-chain karma — populated only after the first tip received
            or task completed flips the KarmaAccount PDA into existence. */}
        {onchainKarma && (
          <div className="px-3 sm:px-6 pb-6 sm:pb-8 -mt-4 sm:-mt-6">
            <div className="p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-amber-50 border border-amber-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                    <Zap className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black tracking-tight text-amber-900 leading-none">
                      On-chain receipts
                    </p>
                    <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-1.5">
                      Settled on Solana
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">
                    Tips received
                  </p>
                  <p className="text-xl font-black text-amber-900 mt-1.5 leading-none">
                    {(Number(onchainKarma.tipsReceivedLamports) / 1_000_000_000).toFixed(4)}{" "}
                    <span className="text-xs font-bold">SOL</span>
                  </p>
                  <p className="text-[10px] font-bold text-amber-600/60 mt-1.5">
                    across {formatNumber(onchainKarma.tipsReceivedCount)} tip{onchainKarma.tipsReceivedCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">
                    Tasks completed
                  </p>
                  <p className="text-xl font-black text-amber-900 mt-1.5 leading-none">
                    {formatNumber(onchainKarma.tasksCompletedCount)}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600/60 mt-1.5">
                    {(Number(onchainKarma.tasksCompletedRewardLamports) / 1_000_000_000).toFixed(4)} SOL earned
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Tabs */}
        <div className="flex px-3 sm:px-6 mb-6 sm:mb-8 gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 rounded-full text-[13px] font-bold transition-all active:scale-95",
                activeTab === tab
                  ? "bg-black text-white shadow-xl shadow-black/10"
                  : "bg-white border border-[#f0f0f0] text-muted-foreground hover:bg-muted/30"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === "Posts" && (
          <div className="flex flex-col gap-4 px-3 sm:px-6 pb-24">
            <PostsFeed
              tweets={allPosts}
              isLoading={hubOwnLoading && allPosts.length === 0}
            />
          </div>
        )}
        {activeTab === "Media" && (
          <ActivityGrid
            tweets={allPosts}
            isLoading={hubOwnLoading && allPosts.length === 0}
          />
        )}

        {activeTab === "Stats" && (
          <div className="flex flex-col gap-3 px-3 sm:px-6 pb-24">
            {karma && Object.entries(karma.breakdown).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between h-20 px-8 rounded-[28px] bg-white border border-[#f0f0f0] shadow-sm">
                <span className="text-[14px] font-bold text-muted-foreground uppercase tracking-widest">{label.replace('Karma', '')} Pulse</span>
                <span className="text-[20px] font-black text-black">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal (Simplified) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-lg p-6 sm:p-10 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-6 sm:mb-8">Edit Identity</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-2 block">Display Name</label>
                <input
                  value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full h-14 px-6 rounded-2xl bg-[#f9f9f9] border border-[#f0f0f0] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-2 block">Biography</label>
                <textarea
                  value={editBio} onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-6 py-4 rounded-2xl bg-[#f9f9f9] border border-[#f0f0f0] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-14 rounded-2xl bg-[#f5f5f5] text-black font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      if (currentUser) {
                        updateCurrentUser({ displayName: editName, bio: editBio });
                      }
                      if (isAuthenticated) {
                        await publishUserData({
                          displayName: editName,
                          bio: editBio,
                          location: editLocation,
                        });
                      }
                      setIsEditing(false);
                    } catch {
                      // keep modal open; error shown below
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="flex-1 h-14 rounded-2xl bg-black text-white font-bold disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Pulse"}
                </button>
              </div>
              {publishError && (
                <p className="text-[12px] text-red-500 font-bold mt-2">
                  {publishError.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {followListKind && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setFollowListKind(null)}
        >
          <div
            className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-[#f0f0f0]">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight capitalize">
                {followListKind}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
              {followListLoading && followListUsers.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!followListLoading && followListUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No {followListKind} yet.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {followListUsers.map((u) => (
                  <div
                    key={u.tid}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#fcfcfc] border border-[#f0f0f0]"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-muted/40 flex items-center justify-center text-[10px] font-black">
                      TID
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold tracking-tight">
                        {u.username ? `@${u.username}` : `tid:${u.tid}`}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        tid {u.tid}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 sm:px-8 py-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => setFollowListKind(null)}
                className="w-full h-12 rounded-2xl bg-[#f5f5f5] text-black font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-2xl">
          Link copied!
        </div>
      )}
    </div>
  );
}
