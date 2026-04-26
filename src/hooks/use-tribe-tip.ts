"use client";

import { useCallback, useState } from "react";
import { signAndPublishTip } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribeTip() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const tip = useCallback(
    async (
      recipientTid: number,
      amount: number,
      opts: Parameters<typeof signAndPublishTip>[4] = {}
    ) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishTip(
          identity.tid,
          recipientTid,
          amount,
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

  return { tip, pending, error, ready: identity !== null };
}
