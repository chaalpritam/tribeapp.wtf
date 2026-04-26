"use client";

import { useState, useEffect, useCallback } from "react";

interface UseLikeReturn {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

/**
 * Optimistic like state for a piece of seed content. The tribeapp.wtf
 * demo doesn't persist likes server-side; the on-chain reaction message
 * type lives on the protocol roadmap. Until then this just toggles
 * local state.
 */
export function useLike(
  contentId: string | null,
  initialLiked: boolean,
  initialCount: number
): UseLikeReturn {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggleLike = useCallback(async () => {
    if (!contentId || isLoading) return;
    setIsLoading(true);
    setIsLiked((wasLiked) => {
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
      return !wasLiked;
    });
    setIsLoading(false);
  }, [contentId, isLoading]);

  return { isLiked, likeCount, isLoading, toggleLike };
}
