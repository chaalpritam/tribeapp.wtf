"use client";

import { useCallback, useState } from "react";
import {
  signAndPublishCrowdfund,
  signAndPublishPledge,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribeCrowdfund() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      crowdfundId: string,
      title: string,
      goalAmount: number,
      opts: Parameters<typeof signAndPublishCrowdfund>[5] = {}
    ) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishCrowdfund(
          identity.tid,
          crowdfundId,
          title,
          goalAmount,
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

  const pledge = useCallback(
    async (crowdfundId: string, amount: number, currency = "USD") => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishPledge(
          identity.tid,
          crowdfundId,
          amount,
          secret,
          currency
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

  return { create, pledge, pending, error, ready: identity !== null };
}
