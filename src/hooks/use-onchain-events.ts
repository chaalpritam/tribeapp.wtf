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
  metadata_hash: string | null;
  /** Resolved from the off-chain EVENT_ADD envelope via the
   *  metadata_hash JOIN; null when the indexer hasn't captured the
   *  hash yet (e.g. RPC failure during the EventCreated handler). */
  off_title: string | null;
  off_description: string | null;
  off_location_text: string | null;
  off_image_url: string | null;
  /** Resolved from the tids table (off-chain) JOINed on creator_tid. */
  creator_username: string | null;
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
 * Title / description / location come from the off-chain EVENT_ADD
 * envelope, JOINed in by the hub via the metadata_hash bridge.
 * Falls back to placeholder copy when the envelope hasn't been
 * captured yet (RPC failure during indexing) so the card still
 * renders something meaningful.
 */
function adaptOnchainEvent(
  row: RawOnchainEvent,
  cityId: string
): ExploreItem {
  const goingCount = row.yes_count ?? 0;
  const creatorLabel = row.creator_username
    ? `@${row.creator_username}`
    : `tid:${row.creator_tid}`;
  const fallbackDescription = `Anchored on Solana by ${creatorLabel}. ${
    goingCount > 0 ? `${goingCount} going so far.` : "Be the first to RSVP."
  }`;
  return {
    id: `onchain-event-${row.pda}`,
    type: "event",
    title: row.off_title ?? `On-chain event #${row.event_id}`,
    description: row.off_description ?? fallbackDescription,
    icon: "calendar",
    color: "#6366F1",
    participants: goingCount,
    location: row.off_location_text ?? "On-chain",
    timeAgo: relativeTime(row.starts_at),
    imageUrl: row.off_image_url ?? undefined,
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
