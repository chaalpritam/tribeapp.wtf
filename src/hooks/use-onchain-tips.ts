"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RawTipsForTarget {
  tip_count: number;
  total_lamports: string | number | null;
}

export interface OnchainTipAggregate {
  tipCount: number;
  totalLamports: bigint;
  totalSol: number;
}

const EMPTY: OnchainTipAggregate = {
  tipCount: 0,
  totalLamports: BigInt(0),
  totalSol: 0,
};

/**
 * Fetch on-chain tip aggregate (count + total SOL) for a tweet hash.
 * The hub keys tips by the base64 blake3 of the tweet, which is the
 * same value used as `tweet.id` in the home feed.
 */
export function useOnchainTipsForTarget(targetHash: string | null | undefined) {
  const [data, setData] = useState<OnchainTipAggregate>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!targetHash) {
      setData(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const res = await hubFetch(
        `/v1/tips/onchain/target/${encodeURIComponent(targetHash)}`
      );
      if (!res.ok) {
        throw new Error(`Onchain tips fetch failed: ${res.statusText}`);
      }
      const json = (await res.json()) as RawTipsForTarget;
      const lamports = BigInt(json.total_lamports?.toString() ?? "0");
      setData({
        tipCount: json.tip_count ?? 0,
        totalLamports: lamports,
        totalSol: Number(lamports) / LAMPORTS_PER_SOL,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [targetHash]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
