"use client";

import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { hubFetch } from "@/lib/tribe";
import type { Task, User } from "@/types";

interface RawOnchainTask {
  pda: string;
  creator: string;
  creator_tid: string | number;
  task_id: string | number;
  /** 0=Open, 1=Claimed, 2=Completed, 3=Cancelled. */
  status: number;
  reward_amount: string | number;
  claimer: string | null;
  claimer_tid: string | number | null;
  created_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface ListTasksOptions {
  limit?: number;
  creatorTid?: string | number;
  /** 0..3 to filter; default returns Open tasks only. */
  status?: 0 | 1 | 2 | 3 | "all";
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
 * Map an on-chain task row into the home feed's Task shape. Title
 * and description live in the off-chain TASK_ADD envelope (separate
 * metadata-hash bridge); placeholder copy here renders something
 * meaningful while the on-chain claim flow stays live via TaskCard's
 * claimOnchain branch.
 */
function adaptOnchainTask(row: RawOnchainTask, cityId: string): Task {
  const rewardLamports = BigInt(row.reward_amount.toString());
  const rewardSol = Number(rewardLamports) / LAMPORTS_PER_SOL;
  return {
    id: `onchain-task-${row.pda}`,
    user: placeholderUser(row.creator_tid, cityId),
    title: `On-chain task #${row.task_id}`,
    description:
      rewardLamports > BigInt(0)
        ? `Anchored on Solana. Reward escrowed in the Task PDA.`
        : `Anchored on Solana. Gratitude only.`,
    icon: "alert",
    location: "On-chain",
    helpers: row.claimer_tid !== null ? 1 : 0,
    timeAgo: relativeTime(row.created_at),
    reward:
      rewardLamports > BigInt(0)
        ? `${rewardSol.toFixed(4)} SOL`
        : "Gratitude",
    isUrgent: false,
    onchainTaskPda: row.pda,
    onchainRewardLamports:
      rewardLamports > BigInt(0) ? rewardLamports.toString() : undefined,
  };
}

export function useOnchainTasks(opts: ListTasksOptions = {}) {
  const { limit = 50, creatorTid, status = 0, cityId = "" } = opts;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (creatorTid !== undefined) params.set("creator_tid", String(creatorTid));
      if (status !== "all") params.set("status", String(status));
      const res = await hubFetch(`/v1/tasks/onchain?${params}`);
      if (!res.ok) {
        throw new Error(`Onchain tasks fetch failed: ${res.statusText}`);
      }
      const json = (await res.json()) as { tasks: RawOnchainTask[] };
      setTasks((json.tasks ?? []).map((row) => adaptOnchainTask(row, cityId)));
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

  return { tasks, loading, error, refresh };
}
