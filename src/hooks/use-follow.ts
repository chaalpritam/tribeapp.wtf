"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";

interface UseFollowReturn {
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useFollow(targetProfileId: string | null): UseFollowReturn {
  const { profile, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial follow status
  useEffect(() => {
    if (!isAuthenticated || !profile?.id || !targetProfileId) return;
    if (profile.id === targetProfileId) return;

    fetch(
      `/api/followers/state?startId=${encodeURIComponent(profile.id)}&endId=${encodeURIComponent(targetProfileId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((result) => setIsFollowing(result.isFollowing))
      .catch(() => {});
  }, [isAuthenticated, profile?.id, targetProfileId]);

  const toggleFollow = useCallback(async () => {
    if (!isAuthenticated || !profile?.id || !targetProfileId || isLoading) return;

    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setIsLoading(true);

    try {
      const endpoint = wasFollowing
        ? "/api/followers/remove"
        : "/api/followers/add";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startId: profile.id,
          endId: targetProfileId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback on failure
      setIsFollowing(wasFollowing);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id, targetProfileId, isFollowing, isLoading]);

  return { isFollowing, isLoading, toggleFollow };
}
