"use client";

import { useCallback, useEffect, useState } from "react";
import { listChannels, getChannelsForTid, type ChannelInfo } from "@/lib/tribe";
import { useTribeRealtime } from "./use-tribe-realtime";

interface UseHubChannelsOptions {
  /** Pull only channels the given TID has joined (uses
   *  /v1/channels/member/<tid>). Falls back to the global list when
   *  null. */
  memberOf?: number | null;
  enabled?: boolean;
}

/**
 * Read-only hook for the protocol's channel list. Powers the Tribes
 * surface and the in-app channel pickers — write paths (create / join
 * / leave) live in `useTribeChannels`.
 */
export function useHubChannels({
  memberOf,
  enabled = true,
}: UseHubChannelsOptions = {}) {
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = memberOf != null
        ? await getChannelsForTid(memberOf)
        : await listChannels(50, 0);
      setChannels(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [memberOf, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh on hub gossip — channel creates and joins broadcast as
  // generic new_message events; the cheapest reaction is a refetch.
  useTribeRealtime("new_message", () => {
    if (enabled) void load();
  });

  return { channels, loading, error, refresh: load };
}
