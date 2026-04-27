"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RawTipperRow {
  pda: string;
  sender: string;
  sender_tid: string | number;
  amount: string | number;
  created_at: string;
  tx_signature: string;
  sender_username: string | null;
}

interface RawTipsForTarget {
  tips: RawTipperRow[];
  tip_count: number;
  total_lamports: string | number | null;
}

export interface Tipper {
  pda: string;
  senderTid: string;
  username: string | null;
  amountLamports: bigint;
  amountSol: number;
  createdAt: string;
  txSignature: string;
}

export interface OnchainTipAggregate {
  tipCount: number;
  totalLamports: bigint;
  totalSol: number;
  tippers: Tipper[];
}

const EMPTY: OnchainTipAggregate = {
  tipCount: 0,
  totalLamports: BigInt(0),
  totalSol: 0,
  tippers: [],
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
      const tippers: Tipper[] = (json.tips ?? []).map((row) => {
        const amount = BigInt(row.amount?.toString() ?? "0");
        return {
          pda: row.pda,
          senderTid: String(row.sender_tid),
          username: row.sender_username,
          amountLamports: amount,
          amountSol: Number(amount) / LAMPORTS_PER_SOL,
          createdAt: row.created_at,
          txSignature: row.tx_signature,
        };
      });
      setData({
        tipCount: json.tip_count ?? 0,
        totalLamports: lamports,
        totalSol: Number(lamports) / LAMPORTS_PER_SOL,
        tippers,
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
