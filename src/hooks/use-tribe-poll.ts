"use client";

import { useCallback, useState } from "react";
import { signAndPublishPoll, signAndPublishPollVote } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribePoll() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      pollId: string,
      question: string,
      options: string[],
      opts: { expiresAtUnix?: number; channelId?: string } = {}
    ) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishPoll(
          identity.tid,
          pollId,
          question,
          options,
          secret,
          opts
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

  const vote = useCallback(
    async (pollId: string, optionIndex: number) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishPollVote(
          identity.tid,
          pollId,
          optionIndex,
          secret
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

  return { create, vote, pending, error, ready: identity !== null };
}
