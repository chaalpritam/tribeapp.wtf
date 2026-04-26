"use client";

import { useState, useEffect, useCallback } from "react";

interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  address?: string;
}

export function useFarcasterUser(fid: number | null | undefined) {
  const [user, setUser] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!fid) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/neynar/user?fid=${fid}`);
      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      const u = data.user;
      if (!u) throw new Error("User not found");

      const address = u.custody_address || u.verifications?.[0];

      setUser({
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        bio: u.profile?.bio?.text ?? "",
        followerCount: u.follower_count ?? 0,
        followingCount: u.following_count ?? 0,
        address,
      });

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message ?? "Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, refetch: fetchUser };
}
