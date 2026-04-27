"use client";

import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { hubFetch } from "@/lib/tribe";
import type { Crowdfund, User } from "@/types";

interface RawOnchainCrowdfund {
  pda: string;
  creator: string;
  creator_tid: string | number;
  crowdfund_id: string | number;
  goal_amount: string | number;
  total_pledged: string | number;
  pledge_count: number;
  deadline_at: string;
  /** 0=Active, 1=Succeeded, 2=Failed. */
  status: number;
  created_at: string;
  updated_at: string;
  create_tx_signature: string;
  claim_tx_signature: string | null;
}

interface ListCrowdfundsOptions {
  limit?: number;
  creatorTid?: string | number;
  /** 0=Active (default), 1=Succeeded, 2=Failed, "all". */
  status?: 0 | 1 | 2 | "all";
  cityId?: string;
}

function placeholderUser(tid: string | number, cityId: string): User {
  return {
    id: `tid-${tid}`,
    username: `tid${tid}`,
    displayName: `TID ${tid}`,
    avatarUrl: "",
    cityId,
    isVerified: false,
  };
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Map an on-chain crowdfund row into the home feed's Crowdfund
 * shape. Goal + raised + pledge_count come from the chain
 * directly. Title / description live in the off-chain CROWDFUND_ADD
 * envelope (separate metadata-hash bridge); placeholder copy renders
 * meaningful info while the on-chain pledge flow stays live via
 * CrowdfundCard's pledgeOnchain branch.
 */
function adaptOnchainCrowdfund(
  row: RawOnchainCrowdfund,
  cityId: string
): Crowdfund {
  const goalLamports = BigInt(row.goal_amount.toString());
  const raisedLamports = BigInt(row.total_pledged.toString());
  const goalSol = Number(goalLamports) / LAMPORTS_PER_SOL;
  const raisedSol = Number(raisedLamports) / LAMPORTS_PER_SOL;
  // Default per-pledge is 5% of goal, capped at 1 SOL, floored at
  // 0.001 SOL — matches the create-page composer's default so the
  // user-facing pledge amount stays consistent across both flows.
  const pledgeSol = Math.min(Math.max(goalSol * 0.05, 0.001), 1);

  return {
    id: `onchain-crowdfund-${row.pda}`,
    user: placeholderUser(row.creator_tid, cityId),
    title: `On-chain crowdfund #${row.crowdfund_id}`,
    description: `Anchored on Solana. ${row.pledge_count} backers pledged so far.`,
    icon: "heart",
    location: "On-chain",
    goal: goalSol,
    raised: raisedSol,
    contributors: row.pledge_count,
    timeAgo: relativeTime(row.created_at),
    onchainCrowdfundPda: row.pda,
    onchainPledgeAmountSol: pledgeSol,
  };
}

export function useOnchainCrowdfunds(opts: ListCrowdfundsOptions = {}) {
  const { limit = 50, creatorTid, status = 0, cityId = "" } = opts;
  const [crowdfunds, setCrowdfunds] = useState<Crowdfund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (creatorTid !== undefined) params.set("creator_tid", String(creatorTid));
      if (status !== "all") params.set("status", String(status));
      const res = await hubFetch(`/v1/crowdfunds/onchain?${params}`);
      if (!res.ok) {
        throw new Error(`Onchain crowdfunds fetch failed: ${res.statusText}`);
      }
      const json = (await res.json()) as { crowdfunds: RawOnchainCrowdfund[] };
      setCrowdfunds(
        (json.crowdfunds ?? []).map((row) => adaptOnchainCrowdfund(row, cityId))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [limit, creatorTid, status, cityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { crowdfunds, loading, error, refresh };
}
