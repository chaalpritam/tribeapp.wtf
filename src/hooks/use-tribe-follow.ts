"use client";

import { useCallback, useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { follow as followIx, unfollow as unfollowIx } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

export function useTribeFollow() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const identity = useTribeIdentityStore((s) => s.identity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ready = identity !== null && wallet !== undefined;

  const run = useCallback(
    async (
      action: typeof followIx,
      targetTid: number
    ): Promise<string> => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await action(provider, identity.tid, targetTid);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [connection, wallet, identity]
  );

  const follow = useCallback(
    (targetTid: number) => run(followIx, targetTid),
    [run]
  );
  const unfollow = useCallback(
    (targetTid: number) => run(unfollowIx, targetTid),
    [run]
  );

  return { follow, unfollow, pending, error, ready };
}
