"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { getExistingClient } from "@/lib/xmtp/client";
import { IdentifierKind } from "@xmtp/browser-sdk";

export interface SocialContact {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    address: string;
    isXmtpSupported: boolean;
}

export function useSocialContacts() {
    const { profile, isAuthenticated } = useAuth();
    const { status } = useXmtpStore();
    const [following, setFollowing] = useState<SocialContact[]>([]);
    const [followers, setFollowers] = useState<SocialContact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContacts = useCallback(async () => {
        if (!isAuthenticated || !profile?.fid) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch following AND followers in parallel
            const [followingRes, followersRes] = await Promise.all([
                fetch(`/api/neynar/following?fid=${profile.fid}`),
                fetch(`/api/neynar/followers?fid=${profile.fid}`)
            ]);

            if (!followingRes.ok || !followersRes.ok) throw new Error("Failed to fetch social graph");

            const followingData = await followingRes.json();
            const followersData = await followersRes.json();

            const rawFollowing = followingData.users || [];
            const rawFollowers = followersData.users || [];

            interface NeynarUser {
                fid: number;
                username: string;
                display_name: string;
                pfp_url: string;
                custody_address?: string;
                verifications?: string[];
            }

            const mapUser = (u: { user?: NeynarUser } & NeynarUser): SocialContact | null => {
                const user = u.user || u;
                const address = user.custody_address || user.verifications?.[0];
                if (!address) return null;
                return {
                    fid: user.fid,
                    username: user.username,
                    displayName: user.display_name,
                    pfpUrl: user.pfp_url,
                    address: address.toLowerCase(),
                    isXmtpSupported: false,
                };
            };

            const followingCandidates = rawFollowing.map(mapUser).filter(Boolean) as SocialContact[];
            const followersCandidates = rawFollowers.map(mapUser).filter(Boolean) as SocialContact[];

            // Combined unique candidates for XMTP check
            const allCandidates = [...followingCandidates, ...followersCandidates];
            const uniqueAddresses = Array.from(new Set(allCandidates.map(c => c.address)));

            const client = getExistingClient();
            if (client && status === "connected" && uniqueAddresses.length > 0) {
                const identifiers = uniqueAddresses.map(addr => ({
                    identifier: addr,
                    identifierKind: IdentifierKind.Ethereum
                }));

                try {
                    const reachableMap = await client.canMessage(identifiers);

                    const updateReachability = (c: SocialContact) => {
                        c.isXmtpSupported = !!reachableMap.get(c.address);
                    };

                    followingCandidates.forEach(updateReachability);
                    followersCandidates.forEach(updateReachability);
                } catch (err) {
                    console.warn("Bulk XMTP check failed:", err);
                }
            }

            setFollowing(followingCandidates);
            setFollowers(followersCandidates);
        } catch (err) {
            console.error("Social contacts fetch error:", err);
            setError("Failed to load contacts");
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, profile?.fid, status]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchContacts();
        }
    }, [fetchContacts, isAuthenticated]);

    return {
        following,
        followers,
        xmtpFollowing: following.filter(c => c.isXmtpSupported),
        xmtpFollowers: followers.filter(c => c.isXmtpSupported),
        isLoading,
        error,
        refetch: fetchContacts
    };
}
