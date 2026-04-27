"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";
import type { ExploreItem } from "@/types";

interface RawOnchainEvent {
  pda: string;
  creator: string;
  creator_tid: string | number;
  event_id: string | number;
  starts_at: string;
  created_at: string;
  create_tx_signature: string;
  yes_count: number;
  no_count: number;
  maybe_count: number;
}

interface ListEventsOptions {
  limit?: number;
  /** Default 'upcoming' (server-side filter starts_at >= now). */
  filter?: "all" | "upcoming";
  /** Optional creator TID filter. */
  creatorTid?: string | number;
  /** Default city id used when adapting rows into ExploreItem. */
  cityId?: string;
}

function relativeTime(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((target - now) / 1000);
  const abs = Math.abs(diffSec);
  const future = diffSec >= 0;
  if (abs < 60) return future ? "starts soon" : "just now";
  const minutes = Math.round(abs / 60);
  if (minutes < 60) return future ? `in ${minutes}m` : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return future ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return future ? `in ${days}d` : `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Map an on-chain event row into the home feed's ExploreItem shape.
 *
 * The event-registry program stores only timing + lat/lon + a hash
 * pointing back at the off-chain EVENT_ADD envelope (which carries
 * the title / description / location_text). Without resolving that
 * envelope we use placeholder copy — good enough to demonstrate the
 * full vertical (chain → indexer → hook → home feed → on-chain
 * RSVP), and the metadata bridge is a separate follow-up.
 */
function adaptOnchainEvent(
  row: RawOnchainEvent,
  cityId: string
): ExploreItem {
  const goingCount = row.yes_count ?? 0;
  return {
    id: `onchain-event-${row.pda}`,
    type: "event",
    title: `On-chain event #${row.event_id}`,
    description: `Anchored on Solana by tid:${row.creator_tid}. ${
      goingCount > 0 ? `${goingCount} going so far.` : "Be the first to RSVP."
    }`,
    icon: "calendar",
    color: "#6366F1",
    participants: goingCount,
    location: "On-chain",
    timeAgo: relativeTime(row.starts_at),
    isTrending: goingCount >= 5,
    cityId,
    onchainEventPda: row.pda,
  };
}

/**
 * Fetch on-chain events from the hub mirror and adapt them into the
 * home feed's ExploreItem shape. Re-renders propagate via the
 * standard React state machine; refresh() is exposed for callers
 * that want manual refetch (e.g. after their own create_event).
 */
export function useOnchainEvents(opts: ListEventsOptions = {}) {
  const {
    limit = 50,
    filter = "upcoming",
    creatorTid,
    cityId = "",
  } = opts;

  const [events, setEvents] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        filter,
      });
      if (creatorTid !== undefined) {
        params.set("creator_tid", String(creatorTid));
      }
      const res = await hubFetch(`/v1/events/onchain?${params}`);
      if (!res.ok) {
        throw new Error(`Onchain events fetch failed: ${res.statusText}`);
      }
      const json = (await res.json()) as { events: RawOnchainEvent[] };
      setEvents(
        (json.events ?? []).map((row) => adaptOnchainEvent(row, cityId))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [limit, filter, creatorTid, cityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
}
