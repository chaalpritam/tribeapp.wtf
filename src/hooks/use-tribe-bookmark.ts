"use client";

import { useCallback, useState } from "react";
import { signAndPublishBookmark } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Toggle a bookmark for a tweet hash. The hub stores per-TID
 * bookmark rows; this hook publishes BOOKMARK_ADD or BOOKMARK_REMOVE
 * envelopes signed with the caller's app key.
 */
export function useTribeBookmark() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setBookmarked = useCallback(
    async (targetHash: string, bookmarked: boolean) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishBookmark(
          identity.tid,
          targetHash,
          secret,
          !bookmarked
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [identity]
  );

  return {
    setBookmarked,
    pending,
    error,
    ready: identity !== null,
  };
}
