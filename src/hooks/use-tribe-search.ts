"use client";

import { useEffect, useState } from "react";
import {
  searchChannels,
  searchTweets,
  searchUsers,
  type ChannelSearchHit,
  type TribeTweet,
  type UserSearchHit,
} from "@/lib/tribe";

interface UseTribeSearchResult {
  tweets: TribeTweet[];
  users: UserSearchHit[];
  channels: ChannelSearchHit[];
  loading: boolean;
  error: Error | null;
}

interface UseTribeSearchOptions {
  /** Skip the request entirely when false. */
  enabled?: boolean;
  /** Number of characters required before a request fires. */
  minLength?: number;
  /** Debounce delay in ms. */
  debounceMs?: number;
}

/**
 * Debounced cross-primitive hub search. Fires three parallel reads
 * (tweets, users, channels) once the query settles for `debounceMs`,
 * cancels in-flight responses on subsequent typing so a slow request
 * never races a faster successor and overwrites fresher results.
 */
export function useTribeSearch(
  query: string,
  {
    enabled = true,
    minLength = 2,
    debounceMs = 300,
  }: UseTribeSearchOptions = {}
): UseTribeSearchResult {
  const [tweets, setTweets] = useState<TribeTweet[]>([]);
  const [users, setUsers] = useState<UserSearchHit[]>([]);
  const [channels, setChannels] = useState<ChannelSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < minLength) {
      setTweets([]);
      setUsers([]);
      setChannels([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const [tweetsRes, usersRes, channelsRes] = await Promise.all([
          searchTweets(trimmed).catch(() => ({ tweets: [] as TribeTweet[] })),
          searchUsers(trimmed).catch(() => [] as UserSearchHit[]),
          searchChannels(trimmed).catch(() => [] as ChannelSearchHit[]),
        ]);
        if (cancelled) return;
        setTweets(
          (tweetsRes as { tweets?: TribeTweet[] }).tweets ?? []
        );
        setUsers(usersRes);
        setChannels(channelsRes);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, minLength, debounceMs]);

  return { tweets, users, channels, loading, error };
}
