"use client";

import { useCallback, useEffect, useState } from "react";
import { dmPublicKey, getDmKey, registerDmKey } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Make sure the current TID's x25519 pubkey is registered on the hub
 * so peers can encrypt to us. Calls registerDmKey once if the local
 * pubkey doesn't match (or isn't present in) the hub record.
 */
export function useTribeDmKey() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [status, setStatus] = useState<"idle" | "syncing" | "ready" | "error">(
    "idle"
  );
  const [error, setError] = useState<Error | null>(null);

  const sync = useCallback(async () => {
    if (!identity) {
      setStatus("idle");
      return;
    }
    setStatus("syncing");
    setError(null);
    try {
      const local = dmPublicKey();
      const remote = await getDmKey(identity.tid);
      if (remote !== local) {
        const secret = fromBase64(identity.appKeySecret);
        await registerDmKey(identity.tid, secret);
      }
      setStatus("ready");
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setStatus("error");
    }
  }, [identity]);

  useEffect(() => {
    void sync();
  }, [sync]);

  return { status, error, refresh: sync, ready: status === "ready" };
}
