"use client";

import { useCallback, useState } from "react";
import { signAndPublishTweet } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribePublish() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publish = useCallback(
    async (
      text: string,
      opts: { parentHash?: string; channelId?: string; embeds?: string[] } = {}
    ) => {
      if (!identity) {
        throw new Error("No tribe identity — register or sign in first");
      }
      setPublishing(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        const result = await signAndPublishTweet(
          identity.tid,
          text,
          secret,
          opts
        );
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPublishing(false);
      }
    },
    [identity]
  );

  return { publish, publishing, error, ready: identity !== null };
}
