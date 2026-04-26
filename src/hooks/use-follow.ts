"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useTribeFollow } from "./use-tribe-follow";

interface UseFollowOptions {
  /**
   * Numeric TID of the target. When supplied and the caller is signed
   * in with a wallet, the toggle calls the on-chain follow / unfollow
   * via tribe-protocol's social-graph program. Without it the hook
   * just flips local state (used by seed profile cards that don't have
   * a real TID).
   */
  targetTid?: number;
}

interface UseFollowReturn {
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useFollow(
  targetProfileId: string | null,
  options: UseFollowOptions = {}
): UseFollowReturn {
  const { isAuthenticated, profile } = useAuth();
  const tribe = useTribeFollow();
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
    const wasFollowing = isFollowing;
    setIsLoading(true);
    setIsFollowing(!wasFollowing);

    try {
      if (options.targetTid && tribe.ready) {
        if (wasFollowing) {
          await tribe.unfollow(options.targetTid);
        } else {
          await tribe.follow(options.targetTid);
        }
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    profile?.id,
    targetProfileId,
    isLoading,
    isFollowing,
    options.targetTid,
    tribe,
  ]);

  return { isFollowing, isLoading, toggleFollow };
}
