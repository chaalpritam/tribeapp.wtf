"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Settings, MapPin, BadgeCheck, Star, Award, PlusCircle, Heart, MessageCircle, Share2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useTribeStore } from "@/store/use-tribe-store";
import { TweetCard } from "@/components/features/home/tweet-card";
import { useAuth } from "@/hooks/use-auth";
import { karmaLevelConfig, getKarmaProgress } from "@/lib/theme";
import { cn, formatNumber } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useShare } from "@/hooks/use-share";
import { AppHeader } from "@/components/layout/app-header";

const tabs = ["Posts", "Media", "Badges", "Stats"];

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
  const { currentUser, updateCurrentUser, tweets } = useTribeStore();
  const { isAuthenticated, profile, tid } = useAuth();
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

  const karma = currentUser?.karma;
  const levelConfig = karma ? karmaLevelConfig[karma.level] : null;
  const progress = karma ? getKarmaProgress(karma.totalKarma, karma.level) : 0;

  const displayName =
    profile?.displayName || profile?.username || currentUser?.displayName || `tid:${tid ?? "?"}`;

  const displayBio = currentUser?.bio || "";

  const displayAvatar = profile?.image || currentUser?.avatarUrl || "/default-avatar.png";

  const displayHandle = profile?.username
    ? `@${profile.username}`
    : currentUser?.username
      ? `@${currentUser.username}`
      : tid
        ? `tid:${tid}`
        : "";

  const socialCounts = { followers: 0, following: 0, posts: 0 };

  const allPosts = currentUser
    ? tweets.filter((c) => c.user.id === currentUser.id)
    : [];

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
                  <div className="text-center sm:text-left">
                    <p className="text-[17px] sm:text-[20px] font-black leading-none">{formatNumber(socialCounts.followers)}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Followers</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[17px] sm:text-[20px] font-black leading-none">{formatNumber(socialCounts.following)}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Following</p>
                  </div>
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
            <PostsFeed tweets={allPosts} />
          </div>
        )}
        {activeTab === "Media" && <ActivityGrid tweets={allPosts} />}

        {activeTab === "Badges" && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6 pb-24">
            {["Leader", "Organizer", "Contributor", "Adventurer"].map((badge) => (
              <div key={badge} className="flex flex-col items-center justify-center gap-4 rounded-[32px] bg-white border border-[#f0f0f0] px-6 py-10 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03]">
                <div className="h-20 w-20 rounded-[28px] bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Award className="h-10 w-10" />
                </div>
                <span className="text-[15px] font-black tracking-tight">{badge}</span>
              </div>
            ))}
          </div>
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
                      setIsEditing(false);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="flex-1 h-14 rounded-2xl bg-black text-white font-bold disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Pulse"}
                </button>
              </div>
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
