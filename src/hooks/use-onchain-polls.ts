"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";
import type { Poll, User } from "@/types";

interface RawOnchainPoll {
  pda: string;
  creator: string;
  creator_tid: string | number;
  poll_id: string | number;
  option_count: number;
  created_at: string;
  create_tx_signature: string;
  total_votes: number;
}

interface ListPollsOptions {
  limit?: number;
  creatorTid?: string | number;
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

/**
 * Map an on-chain poll row into the home feed's Poll shape. Real
 * question + per-option labels live in the off-chain POLL_ADD
 * envelope (resolved via metadata-hash; separate follow-up). For
 * now the card shows generic "Option N" labels — votes still settle
 * on chain via the existing voteOnchain path on PollCard.
 */
function adaptOnchainPoll(row: RawOnchainPoll, cityId: string): Poll {
  const options = Array.from({ length: row.option_count }, (_, i) => ({
    id: `option-${i}`,
    text: `Option ${i + 1}`,
  }));
  return {
    id: `onchain-poll-${row.pda}`,
    user: placeholderUser(row.creator_tid, cityId),
    question: `On-chain poll #${row.poll_id}`,
    options,
    duration: 7 * 24 * 60 * 60, // display-only fallback
    timestamp: new Date(row.created_at).toLocaleDateString(),
    votes: Object.fromEntries(options.map((o) => [o.id, 0])),
    onchainPollPda: row.pda,
  };
}

export function useOnchainPolls(opts: ListPollsOptions = {}) {
  const { limit = 50, creatorTid, cityId = "" } = opts;
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (creatorTid !== undefined) params.set("creator_tid", String(creatorTid));
      const res = await hubFetch(`/v1/polls/onchain?${params}`);
      if (!res.ok) {
        throw new Error(`Onchain polls fetch failed: ${res.statusText}`);
      }
      const json = (await res.json()) as { polls: RawOnchainPoll[] };
      setPolls((json.polls ?? []).map((row) => adaptOnchainPoll(row, cityId)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [limit, creatorTid, cityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { polls, loading, error, refresh };
}
