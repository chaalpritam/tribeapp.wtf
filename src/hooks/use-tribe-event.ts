"use client";

import { useCallback, useState } from "react";
import { signAndPublishEvent, signAndPublishRsvp } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribeEvent() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      eventId: string,
      title: string,
      startsAtUnix: number,
      opts: Parameters<typeof signAndPublishEvent>[5] = {}
    ) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishEvent(
          identity.tid,
          eventId,
          title,
          startsAtUnix,
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

  const rsvp = useCallback(
    async (eventId: string, status: "yes" | "no" | "maybe") => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishRsvp(identity.tid, eventId, status, secret);
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

  return { create, rsvp, pending, error, ready: identity !== null };
}
