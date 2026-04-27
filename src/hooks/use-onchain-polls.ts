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
  metadata_hash: string | null;
  /** Resolved from the off-chain POLL_ADD envelope via metadata_hash. */
  off_question: string | null;
  /** TEXT[] from Postgres comes through as a JS string[]. */
  off_options: string[] | null;
  total_votes: number;
  /**
   * Per-option vote counts, keyed by option_index as a string (JSON
   * object keys are always strings). Missing keys mean zero votes for
   * that option.
   */
  option_tallies: Record<string, number> | null;
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
 * question + per-option labels come from the off-chain POLL_ADD
 * envelope, JOINed in by the hub via the metadata-hash bridge.
 * Falls back to placeholder copy when the envelope hasn't been
 * captured yet.
 */
function adaptOnchainPoll(row: RawOnchainPoll, cityId: string): Poll {
  // Prefer the envelope's option labels when present; pad / trim to
  // option_count so the on-chain Vote PDA's option_index lines up
  // with the rendered choices.
  const labels = row.off_options ?? [];
  const options = Array.from({ length: row.option_count }, (_, i) => ({
    id: `option-${i}`,
    text: labels[i] ?? `Option ${i + 1}`,
  }));
  const tallies = row.option_tallies ?? {};
  return {
    id: `onchain-poll-${row.pda}`,
    user: placeholderUser(row.creator_tid, cityId),
    question: row.off_question ?? `On-chain poll #${row.poll_id}`,
    options,
    duration: 7 * 24 * 60 * 60, // display-only fallback
    timestamp: new Date(row.created_at).toLocaleDateString(),
    votes: Object.fromEntries(
      options.map((o, i) => [o.id, tallies[String(i)] ?? 0])
    ),
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
