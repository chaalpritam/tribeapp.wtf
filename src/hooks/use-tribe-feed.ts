"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchGlobalFeed,
  fetchTweets,
  fetchChannelFeed,
  type TribeTweet,
} from "@/lib/tribe";
import { useTribeRealtime } from "./use-tribe-realtime";

interface UseTribeFeedOptions {
  tid?: string;
  channelId?: string;
  enabled?: boolean;
}

export function useTribeFeed({
  tid,
  channelId,
  enabled = true,
}: UseTribeFeedOptions = {}) {
  const [tweets, setTweets] = useState<TribeTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = channelId
        ? await fetchChannelFeed(channelId)
        : tid
          ? await fetchTweets(tid)
          : await fetchGlobalFeed();
      setTweets(res.tweets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [tid, channelId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh whenever the hub broadcasts a new tweet.
  useTribeRealtime("new_message", () => {
    if (enabled) void load();
  });

  return { tweets, loading, error, refresh: load };
}
