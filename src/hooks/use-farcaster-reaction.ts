"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";

type ReactionType = "like" | "recast";

export function useFarcasterReaction(castHash: string | undefined) {
  const { signerUuid } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const react = useCallback(
    async (reactionType: ReactionType) => {
      if (!signerUuid || !castHash) return false;

      setIsLoading(true);
      try {
        const res = await fetch("/api/neynar/reaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerUuid,
            reactionType,
            target: castHash,
          }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signerUuid, castHash]
  );

  const unreact = useCallback(
    async (reactionType: ReactionType) => {
      if (!signerUuid || !castHash) return false;

      setIsLoading(true);
      try {
        const res = await fetch("/api/neynar/reaction", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerUuid,
            reactionType,
            target: castHash,
          }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signerUuid, castHash]
  );

  return { react, unreact, isLoading };
}
