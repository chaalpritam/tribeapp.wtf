"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import {
    ShieldCheck,
    Loader2,
    MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CastCard } from "@/components/features/home/cast-card";
import { useAuth } from "@/hooks/use-auth";
import { useFarcasterUser } from "@/hooks/use-farcaster-user";
import { useFarcasterFeed } from "@/hooks/use-farcaster-feed";
import { useConversations } from "@/hooks/use-conversations";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { cn, formatNumber } from "@/lib/utils";
import { useShare } from "@/hooks/use-share";
import { AppHeader } from "@/components/layout/app-header";
import type { Cast } from "@/types";

const tabs = ["Posts", "Media", "Badges", "Stats"];

function PostsFeed({ casts, isLoading }: { casts: Cast[]; isLoading?: boolean }) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (casts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-xl font-bold tracking-tight text-black">No posts yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-3 sm:px-6 pb-24">
            {casts.map((cast) => (
                <CastCard key={cast.id} cast={cast} />
            ))}
        </div>
    );
}

export default function UserProfilePage({ params }: { params: Promise<{ fid: string }> }) {
    const { fid: fidParam } = use(params);
    const router = useRouter();
    const { profile, fid: viewerFid } = useAuth();
    const { share, showToast } = useShare();
    const [activeTab, setActiveTab] = useState("Posts");
    const [isMessaging, setIsMessaging] = useState(false);

    const { status } = useXmtpStore();
    const { createDm } = useConversations();

    const targetFid = parseInt(fidParam);

    // Fetch real Farcaster profile data
    const { user: farcasterUser, isLoading: fcUserLoading } = useFarcasterUser(targetFid);

    // Fetch user's Farcaster casts
    const {
        casts: farcasterCasts,
        isLoading: fcCastsLoading,
        error: fcCastsError,
        fetchFeed: fetchFarcasterCasts,
        loadMore,
        hasMore,
    } = useFarcasterFeed({
        feedType: "filter",
        filterType: "fids",
        fid: targetFid,
        viewerFid: viewerFid ?? undefined,
        limit: 20,
    });

    useEffect(() => {
        if (targetFid && farcasterCasts.length === 0 && !fcCastsLoading && !fcCastsError) {
            fetchFarcasterCasts(true);
        }
    }, [targetFid, farcasterCasts.length, fcCastsLoading, fcCastsError, fetchFarcasterCasts]);

    const handleMessageClick = async () => {
        if (isMessaging || !farcasterUser) return;

        setIsMessaging(true);
        try {
            // Get latest status from the store
            let xmtpStatus = useXmtpStore.getState().status;

            // 0. Auto-connect if idle
            if (xmtpStatus === "idle") {
                await useXmtpStore.getState().connect("farcaster", profile);
                xmtpStatus = useXmtpStore.getState().status;
            }

            if (xmtpStatus !== "connected") {
                alert(`XMTP connection failed: ${xmtpStatus}. Please visit the Chat tab.`);
                setIsMessaging(false);
                return;
            }

            const { resolveFidToXmtp, checkXmtpReachability } = await import("@/lib/xmtp/resolution");

            // 1. Resolve direct to XMTP via FID
            const identity = await resolveFidToXmtp(farcasterUser.fid);
            if (!identity || !identity.address) {
                alert("Could not find an Ethereum address for this user. They might not have a linked wallet.");
                setIsMessaging(false);
                return;
            }

            const address = identity.address;

            // 2. Check reachability
            const isReachable = await checkXmtpReachability(address);
            if (!isReachable) {
                alert("This user is not active on XMTP yet.");
                setIsMessaging(false);
                return;
            }

            // 3. Create DM
            const conversationId = await createDm(address);
            if (conversationId) {
                router.push(`/chat/${conversationId}`);
            } else {
                alert("Failed to start conversation.");
                setIsMessaging(false);
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Failed to start chat:", error);
            alert(`Messaging error: ${error.message || "Unknown error"}`);
            setIsMessaging(false);
        }
    };

    if (fcUserLoading && !farcasterUser) {
        return (
            <div className="bg-[#fcfcfc] min-h-screen">
                <AppHeader title="Profile" />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </div>
        );
    }

    if (!farcasterUser) {
        return (
            <div className="bg-[#fcfcfc] min-h-screen">
                <AppHeader title="Profile" />
                <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
                    <h2 className="text-2xl font-black text-black mb-2">User not found</h2>
                    <button onClick={() => router.back()} className="text-indigo-500 font-bold">Go back</button>
                </div>
            </div>
        );
    }

    const socialCounts = {
        followers: farcasterUser.followerCount,
        following: farcasterUser.followingCount,
        posts: farcasterCasts.length || 0,
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen">
            <AppHeader
                title={farcasterUser.displayName}
                showBackButton={true}
            />

            <div className="max-w-2xl mx-auto">
                <div className="px-3 sm:px-6 py-6 sm:py-8">
                    <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-[#f0f0f0] p-5 sm:p-8 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5 sm:gap-8">
                            <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-none rounded-[28px] sm:rounded-[40px] overflow-hidden border-4 border-[#f9f9f9] shadow-inner shrink-0">
                                <Image
                                    src={farcasterUser.pfpUrl || "/default-avatar.png"}
                                    alt={farcasterUser.displayName}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex-1 text-center sm:text-left pt-2">
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-black flex items-center justify-center sm:justify-start gap-2">
                                    {farcasterUser.displayName}
                                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                                </h2>
                                <p className="text-primary font-bold tracking-widest uppercase text-[11px] mt-1.5">
                                    @{farcasterUser.username}
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
                                </div>
                            </div>
                        </div>

                        {farcasterUser.bio && (
                            <p className="mt-8 text-[16px] font-medium text-[#444] leading-relaxed max-w-lg">
                                {farcasterUser.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-8">
                            <div className="flex items-center gap-2 px-5 py-3 rounded-[20px] bg-purple-50 border border-purple-100">
                                <span className="text-[13px] font-bold text-purple-600">FID #{farcasterUser.fid}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-10">
                            <button
                                onClick={handleMessageClick}
                                disabled={status === "connecting" || isMessaging}
                                className="flex-1 flex items-center justify-center gap-2 h-12 sm:h-14 rounded-2xl bg-indigo-500 text-white text-[13px] sm:text-[14px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:grayscale"
                            >
                                {isMessaging ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <MessageSquare className="h-5 w-5" />
                                )}
                                <span>Message</span>
                            </button>
                            <button
                                onClick={() => share(farcasterUser.displayName, farcasterUser.bio || "", window.location.href)}
                                className="flex-1 flex items-center justify-center gap-2 h-12 sm:h-14 rounded-2xl bg-black text-white text-[13px] sm:text-[14px] font-bold"
                            >
                                Share Profile
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex px-3 sm:px-6 mb-6 sm:mb-8 gap-2 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 rounded-full text-[13px] font-bold transition-all",
                                activeTab === tab ? "bg-black text-white" : "bg-white border border-[#f0f0f0] text-muted-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "Posts" && (
                    <div className="flex flex-col gap-4 px-3 sm:px-6 pb-24">
                        <PostsFeed casts={farcasterCasts} isLoading={fcCastsLoading && farcasterCasts.length === 0} />
                        {hasMore && farcasterCasts.length > 0 && (
                            <button
                                onClick={loadMore}
                                disabled={fcCastsLoading}
                                className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#f0f0f0]"
                            >
                                {fcCastsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load older pulses"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showToast && (
                <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-2xl">
                    Link copied!
                </div>
            )}
        </div>
    );
}
