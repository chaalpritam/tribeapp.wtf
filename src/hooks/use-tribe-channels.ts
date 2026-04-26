"use client";

import { useCallback, useState } from "react";
import { signAndPublishChannelOp } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribeChannels() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (channelId: string, name: string, description?: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishChannelOp(
          9,
          identity.tid,
          { channel_id: channelId, name, description },
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

  const join = useCallback(
    async (channelId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishChannelOp(
          10,
          identity.tid,
          { channel_id: channelId },
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

  const leave = useCallback(
    async (channelId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishChannelOp(
          11,
          identity.tid,
          { channel_id: channelId },
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

  return {
    create,
    join,
    leave,
    pending,
    error,
    ready: identity !== null,
  };
}
