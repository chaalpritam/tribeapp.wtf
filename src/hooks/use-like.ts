"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useFarcasterReaction } from "./use-farcaster-reaction";

interface UseLikeReturn {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

export function useLike(
  contentId: string | null,
  initialLiked: boolean,
  initialCount: number,
  castHash?: string
): UseLikeReturn {
  const { profile, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { react, unreact } = useFarcasterReaction(castHash);

  // Sync with props
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  // Check initial like status
  useEffect(() => {
    if (!isAuthenticated || !profile?.id || !contentId) return;
  }, [isAuthenticated, profile?.id, contentId]);

  const toggleLike = useCallback(async () => {
    if (!contentId || isLoading) return;

    const wasLiked = isLiked;
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    setIsLoading(true);

    try {
      // If this is a Farcaster cast, use the Farcaster reaction API
      if (castHash && isAuthenticated) {
        const ok = wasLiked
          ? await unreact("like")
          : await react("like");
        if (!ok) throw new Error("Failed");
      } else if (isAuthenticated && profile?.id) {
        if (wasLiked) {
          const res = await fetch("/api/likes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nodeId: contentId,
              startId: profile.id,
            }),
          });
          if (!res.ok) throw new Error("Failed");
        } else {
          const res = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nodeId: contentId,
              startId: profile.id,
            }),
          });
          if (!res.ok) throw new Error("Failed");
        }
      }
    } catch {
      // Rollback on failure
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setIsLoading(false);
    }
  }, [contentId, castHash, isLiked, isLoading, isAuthenticated, profile?.id, react, unreact]);

  return { isLiked, likeCount, isLoading, toggleLike };
}
