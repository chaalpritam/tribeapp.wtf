"use client";

import { useState, useEffect, useCallback } from "react";
import { signAndPublishReaction } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

interface UseLikeOptions {
  /**
   * Hash of a real on-chain tweet to react against. When supplied and
   * the caller is signed in, the toggle publishes a REACTION_ADD /
   * REACTION_REMOVE envelope to the hub. Without it the hook stays
   * optimistic-only (used by seed cards that have no protocol hash).
   */
  targetHash?: string;
}

interface UseLikeReturn {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useLike(
  contentId: string | null,
  initialLiked: boolean,
  initialCount: number,
  options: UseLikeOptions = {}
): UseLikeReturn {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggleLike = useCallback(async () => {
    if (!contentId || isLoading) return;

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    setIsLoading(true);

    try {
      if (options.targetHash && identity) {
        const secret = fromBase64(identity.appKeySecret);
        await signAndPublishReaction(
          identity.tid,
          options.targetHash,
          "like",
          secret,
          wasLiked
        );
      }
    } catch {
      // Roll back on protocol failure.
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setIsLoading(false);
    }
  }, [contentId, isLoading, isLiked, identity, options.targetHash]);

  return { isLiked, likeCount, isLoading, toggleLike };
}
