"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";

interface UseFollowReturn {
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

/**
 * Optimistic follow state for a profile. The on-chain follow lives in
 * tribe-protocol's social-graph program (see useTribeFollow); this
 * hook is the lightweight UI shim used by demo pages working off seed
 * data, so it just flips local state.
 */
export function useFollow(targetProfileId: string | null): UseFollowReturn {
  const { isAuthenticated, profile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = useCallback(async () => {
    if (
      !isAuthenticated ||
      !profile?.id ||
      !targetProfileId ||
      isLoading ||
      profile.id === targetProfileId
    ) {
      return;
    }
    setIsLoading(true);
    setIsFollowing((prev) => !prev);
    setIsLoading(false);
  }, [isAuthenticated, profile?.id, targetProfileId, isLoading]);

  return { isFollowing, isLoading, toggleFollow };
}
