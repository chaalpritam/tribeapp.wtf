"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";

export interface OnchainKarma {
  tid: string;
  pda: string;
  tipsReceivedCount: number;
  tipsReceivedLamports: bigint;
  tasksCompletedCount: number;
  tasksCompletedRewardLamports: bigint;
  initializedAt: string;
  updatedAt: string;
}

interface RawOnchainKarma {
  tid: string;
  pda: string;
  tips_received_count: string | number;
  tips_received_lamports: string | number;
  tasks_completed_count: string | number;
  tasks_completed_reward_lamports: string | number;
  initialized_at: string;
  updated_at: string;
}

function toBigInt(v: string | number): bigint {
  return typeof v === "bigint" ? v : BigInt(v);
}

/**
 * Read on-chain karma counters for a TID via the hub's mirror table.
 * Returns null when the TID hasn't initialized a KarmaAccount yet
 * (the 404 case from the hub) — the UI should fall back to a
 * "no on-chain karma yet" placeholder rather than treating it as an
 * error.
 */
export function useTribeOnchainKarma(tid: number | null | undefined) {
  const [karma, setKarma] = useState<OnchainKarma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (tid === null || tid === undefined) {
      setKarma(null);
      return;
    }
    setLoading(true);
    try {
      const res = await hubFetch(`/v1/karma/onchain/${tid}`);
      if (res.status === 404) {
        setKarma(null);
        setError(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`Karma fetch failed: ${res.statusText}`);
      }
      const raw = (await res.json()) as RawOnchainKarma;
      setKarma({
        tid: raw.tid,
        pda: raw.pda,
        tipsReceivedCount: Number(raw.tips_received_count),
        tipsReceivedLamports: toBigInt(raw.tips_received_lamports),
        tasksCompletedCount: Number(raw.tasks_completed_count),
        tasksCompletedRewardLamports: toBigInt(
          raw.tasks_completed_reward_lamports
        ),
        initializedAt: raw.initialized_at,
        updatedAt: raw.updated_at,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { karma, loading, error, refresh };
}
