"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";

interface PublishCastOptions {
  text: string;
  embeds?: { url: string }[];
  channelId?: string;
  parent?: string;
}

export function usePublishCast() {
  const { signerUuid } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(
    async (opts: PublishCastOptions) => {
      if (!signerUuid) {
        setError("Not authenticated — sign in with Farcaster first");
        return null;
      }

      setIsPublishing(true);
      setError(null);

      try {
        const res = await fetch("/api/neynar/cast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerUuid,
            text: opts.text,
            embeds: opts.embeds,
            channelId: opts.channelId,
            parent: opts.parent,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to publish cast");
        }

        return await res.json();
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message ?? "Failed to publish cast");
        return null;
      } finally {
        setIsPublishing(false);
      }
    },
    [signerUuid]
  );

  return { publish, isPublishing, error };
}
